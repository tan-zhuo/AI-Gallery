import { vendorLogo } from '@/lib/logos'
import { cx } from '@/lib/format'

/** 厂商真实 logo；无素材时退化为首字母方块。 */
export function VendorLogo({ vendor, size = 28, className }: { vendor: string; size?: number; className?: string }) {
  const l = vendorLogo(vendor)
  const box = 'shrink-0 grid place-items-center rounded-lg border border-border bg-surface-2 overflow-hidden'
  if (!l) {
    return <span className={cx(box, className)} style={{ width: size, height: size }} aria-hidden><span className="text-[10px] font-semibold text-muted">{vendor.slice(0, 2)}</span></span>
  }
  return (
    <span className={cx(box, className)} style={{ width: size, height: size }} title={vendor}>
      <img src={l.src} alt={`${vendor} logo`} loading="lazy" className={cx('object-contain', l.mono && 'logo-mono')} style={l.mono ? { width: size * 0.56, height: size * 0.56 } : { width: size, height: size }} />
    </span>
  )
}
