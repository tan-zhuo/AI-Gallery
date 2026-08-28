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
