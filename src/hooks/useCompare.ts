import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export const MAX_COMPARE = 4

/** 对比选择只存 URL query，无后端会话 */
export function useCompareIds(): [string[], (ids: string[]) => void] {
  const [sp, setSp] = useSearchParams()
  const ids = (sp.get('ids') ?? '').split(',').filter(Boolean).slice(0, MAX_COMPARE)
  const set = useCallback((next: string[]) => {
    const n = new URLSearchParams(sp)
    if (next.length) n.set('ids', next.join(',')); else n.delete('ids')
    setSp(n, { replace: true })
  }, [sp, setSp])
  return [ids, set]
}
