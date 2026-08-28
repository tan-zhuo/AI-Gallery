import { cx } from '@/lib/format'

export function ScoreBar({ label, value, max = 100, display, sub, tone = 'accent' }: {
  label: string; value?: number; max?: number; display?: string; sub?: string; tone?: 'accent' | 'open' | 'closed'
}) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  const color = tone === 'open' ? 'bg-open' : tone === 'closed' ? 'bg-closed' : 'bg-accent'
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted truncate">{label}</span>
        <span className="num font-medium">{value == null ? '—' : display ?? value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className={cx('h-full rounded-full transition-all', value == null ? 'bg-border' : color)} style={{ width: `${value == null ? 0 : pct}%` }} />
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-muted num">{sub}</div>}
    </div>
  )
}
