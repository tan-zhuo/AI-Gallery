import type { Model } from '@/lib/types'
import { isOpenWeights } from '@/lib/scoring'
import { cx } from '@/lib/format'

type Tone = 'open' | 'closed' | 'neutral' | 'warn' | 'info'
const tones: Record<Tone, string> = {
  open: 'text-open bg-[var(--open-bg)] border-open/30',
  closed: 'text-closed bg-[var(--closed-bg)] border-closed/30',
  neutral: 'text-muted bg-surface-2 border-border',
  warn: 'text-community bg-community/10 border-community/30',
  info: 'text-text bg-surface-2 border-border',
}

export function Badge({ tone = 'neutral', children, title, className }: { tone?: Tone; children: React.ReactNode; title?: string; className?: string }) {
  return (
    <span title={title} className={cx('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  )
}

export function OpennessBadge({ m, size = 'sm' }: { m: Model; size?: 'sm' | 'md' }) {
  const open = isOpenWeights(m)
  return (
    <Badge tone={open ? 'open' : 'closed'} className={size === 'md' ? 'text-xs px-2 py-1' : ''}>
      <span aria-hidden className={cx('inline-block h-1.5 w-1.5 rounded-full', open ? 'bg-open' : 'bg-closed')} />
      {open ? '开源' : '闭源'}
    </Badge>
  )
}

export function LicenseBadge({ m }: { m: Model }) {
  const lc = m.license_commercial
  const tone: Tone = lc === true ? 'neutral' : lc === 'restricted' ? 'warn' : 'warn'
  const label = lc === true ? '可商用' : lc === 'restricted' ? '限制许可' : '不可商用'
  return <Badge tone={tone} title={m.license}>{label} · {m.license}</Badge>
}

/** 详情顶栏徽章组（最多 6 个） */
export function BadgeRow({ m, singleGpu }: { m: Model; singleGpu: boolean }) {
  const items: React.ReactNode[] = [<OpennessBadge key="o" m={m} size="md" />]
  if (m.weights_available) items.push(<Badge key="w" tone="open">权重可下</Badge>)
  else items.push(<Badge key="a" tone="closed">仅 API</Badge>)
  if (m.reasoning_mode !== 'none') items.push(<Badge key="r" tone="info">推理模型{m.reasoning_mode === 'optional' ? '·可关' : ''}</Badge>)
  if (m.modalities.includes('image')) items.push(<Badge key="m" tone="info">多模态</Badge>)
  if (singleGpu) items.push(<Badge key="g" tone="open">单卡可跑</Badge>)
  if (m.status === 'superseded' || m.status === 'deprecated') items.push(<Badge key="s" tone="warn">已被替代</Badge>)
  else if (m.status === 'preview') items.push(<Badge key="p" tone="warn">Preview</Badge>)
  items.push(<LicenseBadge key="l" m={m} />)
  return <div className="flex flex-wrap gap-1.5">{items.slice(0, 7)}</div>
}
