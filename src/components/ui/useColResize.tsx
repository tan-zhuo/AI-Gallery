import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 表格列宽拖拽：首次渲染后量取各列自然宽度，切换为 table-layout: fixed，
 * 之后拖动表头右缘改宽；双击恢复；宽度按 tableId 存 localStorage。
 */
export function useColResize(tableId: string, keys: string[]) {
  const ref = useRef<HTMLTableElement>(null)
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`mb_cols_w_${tableId}`) ?? '{}') } catch { return {} }
  })
  const [ready, setReady] = useState(false)
  const keyStr = keys.join('|')

  // 量取自然宽度（仅对尚无记忆宽度的列）
  useEffect(() => {
    const table = ref.current
    if (!table) return
    const ths = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'))
    setWidths((w) => {
      const next = { ...w }
      ths.forEach((th) => { const k = th.dataset.col; if (k && next[k] == null) next[k] = Math.round(th.getBoundingClientRect().width) })
      return next
    })
    setReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr])

  useEffect(() => { try { localStorage.setItem(`mb_cols_w_${tableId}`, JSON.stringify(widths)) } catch { /* noop */ } }, [tableId, widths])

  const onMouseDown = useCallback((key: string) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const th = (e.currentTarget as HTMLElement).closest('th') as HTMLTableCellElement | null
    const startW = th ? th.getBoundingClientRect().width : (widths[key] ?? 120)
    const move = (ev: MouseEvent) => setWidths((w) => ({ ...w, [key]: Math.max(56, Math.round(startW + ev.clientX - startX)) }))
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.style.cursor = '' }
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }, [widths])

  const reset = useCallback((key: string) => () => setWidths((w) => { const n = { ...w }; delete n[key]; return n }), [])
  const resetAll = useCallback(() => { setWidths({}); setReady(false); setTimeout(() => setReady(true), 0) }, [])

  const thProps = (key: string) => ({
    'data-col': key,
    style: ready && widths[key] ? { width: widths[key] } : undefined,
  })
  const Handle = ({ k }: { k: string }) => (
    <span role="separator" aria-orientation="vertical" title="拖动调整列宽 · 双击恢复" onMouseDown={onMouseDown(k)} onDoubleClick={reset(k)} className="col-handle" />
  )
  const tableStyle: React.CSSProperties = ready && Object.keys(widths).length ? { tableLayout: 'fixed' } : {}
  return { ref, thProps, Handle, tableStyle, resetAll, widths }
}
