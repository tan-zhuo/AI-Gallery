import { useCallback, useRef, useState } from 'react'

/**
 * 表格列宽拖拽。
 *
 * 默认什么都不做：表格用浏览器的 auto 布局，列宽随内容和容器自适应（全宽屏下这比任何
 * 写死的宽度都好）。只有用户真的拖了某一列，才量下当前所有列宽、切到 table-layout: fixed
 * 并接管。宽度按 tableId 存 localStorage；resetAll 交还给 auto 布局。
 */
export function useColResize(tableId: string, _keys: string[]) {
  const ref = useRef<HTMLTableElement>(null)
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(`mb_cols_w_${tableId}`) ?? '{}') } catch { return {} }
  })
  const save = useCallback((w: Record<string, number>) => {
    try { localStorage.setItem(`mb_cols_w_${tableId}`, JSON.stringify(w)) } catch { /* noop */ }
    return w
  }, [tableId])

  /** 拖拽开始时把当前渲染宽度固化下来，否则切 fixed 的一瞬间其它列会跳。 */
  const snapshot = useCallback(() => {
    const table = ref.current
    const out: Record<string, number> = {}
    if (!table) return out
    for (const th of table.querySelectorAll<HTMLTableCellElement>('thead th')) {
      const k = th.dataset.col
      const w = Math.round(th.getBoundingClientRect().width)
      if (k && w > 1) out[k] = w // 响应式隐藏的列量到 0，不记
    }
    return out
  }, [])

  const onMouseDown = useCallback((key: string) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const startX = e.clientX
    const base = { ...snapshot(), ...widths }
    const startW = base[key] ?? 120
    const move = (ev: MouseEvent) => setWidths(save({ ...base, [key]: Math.max(56, Math.round(startW + ev.clientX - startX)) }))
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.style.cursor = '' }
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }, [widths, save, snapshot])

  const reset = useCallback((key: string) => () => setWidths((w) => { const n = { ...w }; delete n[key]; return save(n) }), [save])
  const resetAll = useCallback(() => setWidths(save({})), [save])

  const active = Object.keys(widths).length > 0
  const thProps = (key: string) => ({ 'data-col': key, style: widths[key] ? { width: widths[key] } : undefined })
  const Handle = ({ k }: { k: string }) => (
    <span role="separator" aria-orientation="vertical" title="拖动调整列宽 · 双击恢复" onMouseDown={onMouseDown(k)} onDoubleClick={reset(k)} className="col-handle" />
  )
  const tableStyle: React.CSSProperties = active ? { tableLayout: 'fixed' } : {}
  return { ref, thProps, Handle, tableStyle, resetAll, widths, active }
}
