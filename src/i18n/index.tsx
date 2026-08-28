import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { en } from './en'
import { ja } from './ja'

export type Lang = 'zh' | 'en' | 'ja'
export const LANGS: Array<{ code: Lang; label: string; short: string }> = [
  { code: 'zh', label: '中文', short: '中' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: '日' },
]
const DICT: Record<Exclude<Lang, 'zh'>, Record<string, string>> = { en, ja }

/** 翻译函数：以中文原文为 key；缺失时回退中文。支持 {name} 插值。 */
export type T = (zh: string, vars?: Record<string, string | number>) => string

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: T }>({ lang: 'zh', setLang: () => {}, t: (s) => s })

function detect(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (q === 'en' || q === 'ja' || q === 'zh') return q
    const s = localStorage.getItem('mb_lang')
    if (s === 'en' || s === 'ja' || s === 'zh') return s
    const n = navigator.language.toLowerCase()
    if (n.startsWith('ja')) return 'ja'
    if (n.startsWith('zh')) return 'zh'
    return 'en'
  } catch { return 'zh' }
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem('mb_lang', l) } catch { /* noop */ } }, [])
  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang }, [lang])
  const t = useMemo<T>(() => (zh, vars) => {
    let s = lang === 'zh' ? zh : (DICT[lang][zh] ?? zh)
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }, [lang])
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useT() { return useContext(Ctx) }

/** 非组件环境（如 lib）取当前语言的翻译：只读一次，不响应切换；组件内请用 useT */
export function tStatic(zh: string): string {
  const l = detect()
  return l === 'zh' ? zh : (DICT[l][zh] ?? zh)
}
