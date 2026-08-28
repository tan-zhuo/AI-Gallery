import { Link } from 'react-router-dom'
import type { Model } from '@/lib/types'
import { cx } from '@/lib/format'
import { VendorLogo } from './VendorLogo'

export function ModelName({ m, link = true, size = 'sm', vendor = true, logo = true }: { m: Model; link?: boolean; size?: 'sm' | 'lg'; vendor?: boolean; logo?: boolean }) {
  const inner = (
    <span className="flex items-center gap-2.5 min-w-0">
      {logo && <VendorLogo vendor={m.vendor} size={size === 'lg' ? 40 : 28} />}
      <span className="min-w-0">
      <span className={cx('block truncate font-semibold', size === 'lg' ? 'text-2xl md:text-3xl tracking-tight' : 'text-sm')}>{m.name}</span>
      <span className={cx('block truncate text-muted', size === 'lg' ? 'text-sm mt-1' : 'text-[11px]')}>
        {m.name_zh ? `${m.name_zh} · ` : ''}{vendor && (m.vendor_zh ? `${m.vendor} ${m.vendor_zh}` : m.vendor)}
      </span>
      </span>
    </span>
  )
  return link ? <Link to={`/models/${m.id}`} className="block min-w-0 hover:underline">{inner}</Link> : inner
}
