import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { models } from '@/lib/catalog'
import { filterModels } from '@/lib/search'
import { OpennessBadge } from './ui/Badge'
import { VendorLogo } from './ui/VendorLogo'
import { cx } from '@/lib/format'

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  const nav = useNavigate()
  const results = useMemo(() => (q ? filterModels(models, q) : models.filter((m) => m.status === 'current')).slice(0, 10), [q])
  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => ref.current?.focus(), 10) } }, [open])
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && results[idx]) { nav(`/models/${results[idx].id}`); onClose() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, results, idx, nav, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 pt-[12vh]" onClick={onClose} role="dialog" aria-modal="true" aria-label="搜索模型">
      <div className="card mx-auto max-w-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setIdx(0) }} placeholder="搜索模型名、别称、厂商…" className="w-full bg-transparent px-4 py-3 text-sm outline-none border-b border-border" />
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && <li className="px-4 py-6 text-sm text-muted text-center">无结果</li>}
          {results.map((m, i) => (
            <li key={m.id}>
              <button type="button" onMouseEnter={() => setIdx(i)} onClick={() => { nav(`/models/${m.id}`); onClose() }} className={cx('flex w-full items-center gap-3 px-4 py-2 text-left text-sm', i === idx && 'bg-surface-2')}>
                <VendorLogo vendor={m.vendor} size={24} />
                <span className="font-medium">{m.name}</span>
                <OpennessBadge m={m} />
                <span className="text-muted text-xs truncate">{m.name_zh ?? ''} · {m.vendor}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-4 py-1.5 text-[10px] text-muted flex gap-3"><span>↑↓ 选择</span><span>↵ 打开</span><span>Esc 关闭</span></div>
      </div>
    </div>
  )
}
