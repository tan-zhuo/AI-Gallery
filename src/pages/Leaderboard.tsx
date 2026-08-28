import { useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { buildRows, SCENES } from '@/lib/leaderboard'
import { LeaderboardTable, OPTIONAL_COLS, type OptCol } from '@/components/leaderboard/LeaderboardTable'
import { filterModels } from '@/lib/search'
import type { Scene, Tab } from '@/lib/types'
import { cx } from '@/lib/format'
import { Empty, Button, Disclaimer } from '@/components/ui/Misc'
import { useCompareIds } from '@/hooks/useCompare'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { CompareBar } from './Home'

const TABS: Array<[Tab, string]> = [['all', '综合'], ['open', '开源'], ['closed', '闭源']]

export default function Leaderboard() {
  const { scene: sceneParam } = useParams()
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const scene = (SCENES.some((s) => s.key === sceneParam) ? sceneParam : 'overall') as Scene
  const tab = ((['all', 'open', 'closed'] as Tab[]).includes(sp.get('tab') as Tab) ? sp.get('tab') : 'all') as Tab
  const [q, setQ] = useState('')
  const [verified, setVerified] = useState(false)
  const [cols, setCols] = useLocalStorage<OptCol[]>('mb_cols', ['coding', 'reasoning'])
  const [ids, setIds] = useCompareIds()
  const rows = useMemo(() => buildRows(tab, scene, verified), [tab, scene, verified])
  const shown = useMemo(() => {
    if (!q.trim()) return rows
    const set = new Set(filterModels(rows.map((r) => r.m), q).map((m) => m.id))
    return rows.filter((r) => set.has(r.m.id))
  }, [rows, q])
  const sceneDef = SCENES.find((s) => s.key === scene)!
  const setTab = (t: Tab) => { const n = new URLSearchParams(sp); n.set('tab', t); setSp(n, { replace: true }) }
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
  const exportCsv = () => {
    const head = ['rank', 'model', 'vendor', 'open', 'ref_score', 'elo', 'coding', 'reasoning', 'math', 'agent', 'context', 'price_in', 'price_out']
    const lines = shown.map((r) => [r.rank, r.m.name, r.m.vendor, r.m.weights_available, r.refScore?.toFixed(1) ?? '', r.elo ?? '', r.coding ?? '', r.reasoning ?? '', r.math ?? '', r.agent ?? '', r.m.context.display, r.m.pricing?.input_per_m ?? '', r.m.pricing?.output_per_m ?? ''].join(','))
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `modelboard-${tab}-${scene}.csv`; a.click()
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">排行榜</h1>
          <p className="text-xs text-muted mt-1">{sceneDef.desc}。缺项权重按现有项重分配并标「部分」。</p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-0.5" role="tablist">
          {TABS.map(([t, l]) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={cx('rounded-md px-3 py-1.5 text-sm', tab === t ? 'bg-text text-bg' : 'text-muted hover:text-text')}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {SCENES.map((s) => (
          <button key={s.key} type="button" onClick={() => nav(s.key === 'overall' ? `/leaderboard?tab=${tab}` : `/leaderboard/${s.key}?tab=${tab}`)} className={cx('shrink-0 rounded-full border px-3 py-1 text-xs font-medium', scene === s.key ? 'bg-text text-bg border-text' : 'border-border hover:bg-surface-2')}>{s.label}</button>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="过滤当前表…" className="min-w-[160px] flex-1 rounded-md bg-surface-2 px-3 py-1.5 text-sm outline-none" aria-label="过滤" />
        <label className="flex items-center gap-1.5 text-xs px-2"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />只看有独立复测</label>
        <details className="relative">
          <summary className="cursor-pointer select-none rounded-md border border-border px-2.5 py-1.5 text-xs">列 ({cols.length})</summary>
          <div className="absolute right-0 z-20 mt-1 card p-2 grid grid-cols-2 gap-1 w-56 shadow-xl">
            {OPTIONAL_COLS.map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5 text-xs px-1 py-0.5"><input type="checkbox" checked={cols.includes(k)} onChange={(e) => setCols(e.target.checked ? [...cols, k] : cols.filter((c) => c !== k))} />{l}</label>
            ))}
          </div>
        </details>
        <Button variant="outline" onClick={exportCsv} className="text-xs">导出 CSV</Button>
      </div>

      {shown.length === 0 ? <Empty text="没有匹配的模型" action={<Button variant="outline" onClick={() => { setQ(''); setVerified(false) }}>清空筛选</Button>} />
        : <LeaderboardTable rows={shown} selected={ids} onToggle={toggle} showValue={scene === 'value'} cols={cols} />}
      <Disclaimer />
      {ids.length > 0 && <CompareBar ids={ids} onClear={() => setIds([])} />}
    </div>
  )
}
