import { Link } from 'react-router-dom'
import { cx } from '@/lib/format'

export function Section({ title, sub, children, right, className }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <section className={cx('space-y-3', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-14 text-sm text-muted">
      <span>{text}</span>{action}
    </div>
  )
}

export function Button({ children, onClick, variant = 'ghost', to, className, disabled, type = 'button' }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'outline'; to?: string; className?: string; disabled?: boolean; type?: 'button' | 'submit'
}) {
  const base = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition disabled:opacity-40 disabled:pointer-events-none'
  const v = variant === 'primary' ? 'bg-gradient-to-r from-accent to-accent-2 text-white shadow-[0_6px_20px_-8px_var(--accent)] hover:brightness-110' : variant === 'outline' ? 'border border-border bg-surface hover:bg-surface-2' : 'hover:bg-surface-2'
  if (to) return <Link to={to} className={cx(base, v, className)}>{children}</Link>
  return <button type={type} onClick={onClick} disabled={disabled} className={cx(base, v, className)}>{children}</button>
}

export function Chip({ active, children, onClick, to }: { active?: boolean; children: React.ReactNode; onClick?: () => void; to?: string }) {
  const cls = cx('inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium whitespace-nowrap transition', active ? 'bg-text text-bg border-text' : 'border-border bg-surface hover:bg-surface-2')
  if (to) return <Link to={to} className={cls}>{children}</Link>
  return <button type="button" onClick={onClick} className={cls} aria-pressed={active}>{children}</button>
}

export function Kv({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted">{k}</div>
      <div className={cx('text-sm font-medium truncate', mono && 'num')}>{v}</div>
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="num text-lg font-semibold leading-tight truncate">{value}</div>
      {sub && <div className="text-[11px] text-muted truncate">{sub}</div>}
    </div>
  )
}

export function Disclaimer() {
  return <p className="text-xs text-muted">排名供选型参考，基准会饱和、会泄漏、会过时。</p>
}
