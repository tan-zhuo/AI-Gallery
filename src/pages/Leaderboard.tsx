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
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/i18n'


const TABS: Array<[Tab, string]> = [['all', '综合'], ['open', '开源'], ['closed', '闭源']]

export default function Leaderboard() {
  const { t } = useT()
  const { scene: sceneParam } = useParams()
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const scene = (SCENES.some((s) => s.key === sceneParam) ? sceneParam : 'overall') as Scene
  const tab = ((['all', 'open', 'closed'] as Tab[]).includes(sp.get('tab') as Tab) ? sp.get('tab') : 'all') as Tab
  const [q, setQ] = useState('')
  const [verified, setVerified] = useState(false)
  const [old, setOld] = useState(false)
  const [cols, setCols] = useLocalStorage<OptCol[]>('mb_cols', ['coding', 'reasoning'])
  const [ids, setIds] = useCompareIds()
  const rows = useMemo(() => buildRows(tab, scene, verified, old), [tab, scene, verified, old])
  const shown = useMemo(() => {
    if (!q.trim()) return rows
    const set = new Set(filterModels(rows.map((r) => r.m), q).map((m) => m.id))
    return rows.filter((r) => set.has(r.m.id))
  }, [rows, q])
  const sceneDef = SCENES.find((s) => s.key === scene)!
  useSeo({ title: t('{scene}排行榜', { scene: t(sceneDef.label) }) + (tab === 'open' ? t('（开源）') : tab === 'closed' ? t('（闭源）') : ''), description: t('AI 模型{scene}排行榜：{desc}。带来源与证据等级。', { scene: t(sceneDef.label), desc: t(sceneDef.desc) }) })
  const setTab = (t: Tab) => { const n = new URLSearchParams(sp); n.set('tab', t); setSp(n, { replace: true }) }
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
  const exportCsv = () => {
    const head = ['rank', 'model', 'vendor', 'open', 'ref_score', 'elo', 'coding', 'reasoning', 'math', 'agent', 'context', 'price_in', 'price_out']
    const lines = shown.map((r) => [r.rank, r.m.name, r.m.vendor, r.m.weights_available, r.refScore?.toFixed(1) ?? '', r.elo ?? '', r.coding ?? '', r.reasoning ?? '', r.math ?? '', r.agent ?? '', r.m.context.display, r.m.pricing?.input_per_m ?? '', r.m.pricing?.output_per_m ?? ''].join(','))
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ai-gallery-${tab}-${scene}.csv`; a.click()
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('排行榜')}</h1>
          <p className="text-xs text-muted mt-1">{t('{desc}。缺项权重按现有项重分配并标「部分」。', { desc: t(sceneDef.desc) })}</p>
        </div>
        <div className="seg" role="tablist">
          {TABS.map(([tb, l]) => <button key={tb} role="tab" aria-selected={tab === tb} type="button" onClick={() => setTab(tb)}>{t(l)}</button>)}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {SCENES.map((s) => (
          <button key={s.key} type="button" onClick={() => nav(s.key === 'overall' ? `/leaderboard?tab=${tab}` : `/leaderboard/${s.key}?tab=${tab}`)} className={cx('shrink-0 inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition', scene === s.key ? 'bg-text text-bg border-text' : 'border-border bg-surface hover:bg-surface-2')}>{t(s.label)}</button>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('过滤当前表…')} className="ctl min-w-[160px] flex-1" aria-label={t('过滤')} />
        <label className="check"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />{t('只看有独立复测')}</label>
        <label className="check"><input type="checkbox" checked={old} onChange={(e) => setOld(e.target.checked)} />{t('包含旧代')}</label>
        <details className="relative">
          <summary className="ctl cursor-pointer select-none">{t('列')} <span className="num text-muted">({cols.length})</span><span className="text-muted text-[10px]">▾</span></summary>
          <div className="popover grid grid-cols-2 gap-0.5 w-60">
            {OPTIONAL_COLS.map(([k, l]) => (
              <label key={k} className="check h-8"><input type="checkbox" checked={cols.includes(k)} onChange={(e) => setCols(e.target.checked ? [...cols, k] : cols.filter((c) => c !== k))} />{t(l)}</label>
            ))}
          </div>
        </details>
        <Button variant="outline" onClick={exportCsv}>{t('导出 CSV')}</Button>
      </div>

      {shown.length === 0 ? <Empty text={t('没有匹配的模型')} action={<Button variant="outline" onClick={() => { setQ(''); setVerified(false); setOld(false) }}>{t('清空筛选')}</Button>} />
        : <LeaderboardTable rows={shown} selected={ids} onToggle={toggle} showValue={scene === 'value'} cols={cols} />}
      <Disclaimer />
      {ids.length > 0 && <CompareBar ids={ids} onClear={() => setIds([])} />}
    </div>
  )
}
