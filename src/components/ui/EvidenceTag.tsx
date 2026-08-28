import type { EvidenceLevel } from '@/lib/types'
import { cx } from '@/lib/format'

const map: Record<EvidenceLevel, { label: string; cls: string; sym: string }> = {
  official: { label: '厂商公布', cls: 'text-official border-official/40', sym: '○' },
  independent: { label: '独立复测', cls: 'text-independent border-independent/40', sym: '●' },
  community: { label: '社区/估计', cls: 'text-community border-community/40', sym: '◐' },
  unknown: { label: '未知', cls: 'text-muted border-border', sym: '—' },
}

export function EvidenceTag({ level, compact }: { level: EvidenceLevel; compact?: boolean }) {
  const e = map[level]
  return (
    <span className={cx('inline-flex items-center gap-1 rounded border px-1 py-px text-[10px] leading-none', e.cls)} title={e.label}>
      <span aria-hidden>{e.sym}</span>{!compact && e.label}
    </span>
  )
}
