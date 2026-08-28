import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch { return initial }
  })
  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal((p) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(p) : v
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* noop */ }
      return next
    })
  }, [key])
  return [val, set]
}

export function useTheme(): [boolean, () => void] {
  const [dark, setDark] = useState(() => typeof document === 'undefined' ? true : document.documentElement.classList.contains('dark'))
  const toggle = useCallback(() => {
    setDark((d) => {
      const n = !d
      document.documentElement.classList.toggle('dark', n)
      try { localStorage.setItem('mb_theme', n ? 'dark' : 'light') } catch { /* noop */ }
      return n
    })
  }, [])
  return [dark, toggle]
}
