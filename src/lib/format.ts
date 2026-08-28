import type { Model } from './types'

export function formatParams(total?: string, active?: string): string {
  if (!total) return '未披露'
  return active ? `${total} 总 / ${active} 激活` : total
}

export function formatPrice(input?: number, output?: number): string {
  if (input == null && output == null) return '—'
  const f = (n?: number) => (n == null ? '—' : `$${n.toFixed(n >= 10 ? 0 : 2)}`)
  return `${f(input)} / ${f(output)}`
}

export function formatGB(n?: number): string {
  if (n == null) return '—'
  return `${n >= 100 ? Math.round(n) : n.toFixed(n < 10 ? 1 : 0)} GB`
}

export function formatDate(d?: string): string {
  return d ?? '—'
}

export function priceLabel(m: Model): string {
  if (m.pricing?.input_per_m === 0 && !m.pricing.output_per_m) return '免费层'
  if (m.pricing?.input_per_m != null) return formatPrice(m.pricing.input_per_m, m.pricing.output_per_m)
  return m.weights_available ? '自建' : '—'
}

export function paramsB(s?: string): number | undefined {
  if (!s) return undefined
  const m = s.match(/([\d.]+)\s*([TBM])/i)
  if (!m) return undefined
  const n = parseFloat(m[1])
  const u = m[2].toUpperCase()
  return u === 'T' ? n * 1000 : u === 'M' ? n / 1000 : n
}

export function cx(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(' ')
}

import type { Lang, T } from '@/i18n'
/** 按语言取模型短文案；缺失回退中文 */
export function copyFor(m: Model, lang: Lang) {
  const o = lang === 'zh' ? undefined : m.i18n?.[lang]
  return {
    name_zh: o?.name_zh ?? m.name_zh,
    one_liner: o?.one_liner ?? m.copy.one_liner,
    highlights: o?.highlights ?? m.copy.highlights,
    pitfalls: o?.pitfalls ?? m.copy.pitfalls,
    logic_ability: o?.logic_ability ?? m.copy.logic_ability,
    best_for: o?.best_for ?? m.copy.best_for,
    not_for: o?.not_for ?? m.copy.not_for,
    capability_notes: o?.capability_notes ?? m.capability_notes,
  }
}
/** 可翻译的参数格式 */
export function tParams(t: T, total?: string, active?: string): string {
  if (!total) return t('未披露')
  return active ? t('{total} 总 / {active} 激活', { total, active }) : total
}
