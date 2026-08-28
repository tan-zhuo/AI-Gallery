import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { models, scoreMap, vendors } from '@/lib/catalog'
import { filterModels } from '@/lib/search'
import { computeReferenceScores, getScore, isOpenWeights } from '@/lib/scoring'
import { fitsIn } from '@/lib/vram'
import { paramsB, priceLabel, formatParams, formatGB, cx } from '@/lib/format'
import { OpennessBadge, Badge } from '@/components/ui/Badge'
import { ModelName } from '@/components/ui/ModelName'
import { Empty, Button, Chip } from '@/components/ui/Misc'
import type { Model } from '@/lib/types'

type Sort = 'ref' | 'updated' | 'params' | 'price' | 'elo' | 'name'
const sizeBuckets = [['≤8B', 0, 8], ['8–32B', 8, 32], ['32–70B', 32, 70], ['70B+', 70, Infinity]] as const

export default function Models() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<'all' | 'open' | 'closed' | 'weights' | 'api'>('all')
  const [vendor, setVendor] = useState<string[]>([])
  const [size, setSize] = useState<string[]>([])
  const [lic, setLic] = useState<'all' | 'mit' | 'apache' | 'commercial' | 'restricted'>('all')
  const [mod, setMod] = useState<string[]>([])
  const [hw, setHw] = useState<0 | 16 | 24 | 80>(0)
  const [think, setThink] = useState(false)
  const [sort, setSort] = useState<Sort>('ref')
  const refs = useMemo(() => computeReferenceScores(models, scoreMap), [])
  const list = useMemo(() => {
    let ms = filterModels(models, q)
    ms = ms.filter((m) => {
      if (open === 'open' && !isOpenWeights(m)) return false
      if (open === 'closed' && isOpenWeights(m)) return false
      if (open === 'weights' && !m.weights_available) return false
      if (open === 'api' && m.weights_available) return false
      if (vendor.length && !vendor.includes(m.vendor)) return false
      if (size.length) {
        const p = m.architecture.total_params_b ?? paramsB(m.architecture.total_params)
        if (p == null) return false
        if (!sizeBuckets.some(([l, lo, hi]) => size.includes(l) && p > lo && p <= hi)) return false
      }
      if (lic === 'mit' && !/mit/i.test(m.license)) return false
      if (lic === 'apache' && !/apache/i.test(m.license)) return false
      if (lic === 'commercial' && m.license_commercial !== true) return false
      if (lic === 'restricted' && m.license_commercial !== 'restricted') return false
      if (mod.includes('image') && !m.modalities.includes('image')) return false
      if (mod.includes('tools') && !m.modalities.includes('tools')) return false
      if (hw && !(isOpenWeights(m) && fitsIn(m, hw))) return false
      if (think && m.reasoning_mode === 'none') return false
      return true
    })
    const g = (m: Model, k: string) => getScore(scoreMap, m.id, k)?.value
    const cmp: Record<Sort, (a: Model, b: Model) => number> = {
      ref: (a, b) => (refs.get(b.id)?.score ?? -1) - (refs.get(a.id)?.score ?? -1),
      updated: (a, b) => b.updated_at.localeCompare(a.updated_at),
      params: (a, b) => (b.architecture.total_params_b ?? paramsB(b.architecture.total_params) ?? -1) - (a.architecture.total_params_b ?? paramsB(a.architecture.total_params) ?? -1),
      price: (a, b) => (a.pricing?.input_per_m ?? 1e9) - (b.pricing?.input_per_m ?? 1e9),
      elo: (a, b) => (g(b, 'arena_text') ?? -1) - (g(a, 'arena_text') ?? -1),
      name: (a, b) => a.name.localeCompare(b.name),
    }
    if (!q.trim()) ms = [...ms].sort(cmp[sort])
    return ms
  }, [q, open, vendor, size, lic, mod, hw, think, sort, refs])
  const reset = () => { setQ(''); setOpen('all'); setVendor([]); setSize([]); setLic('all'); setMod([]); setHw(0); setThink(false) }
  const tog = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">模型库</h1><p className="text-xs text-muted mt-1">{list.length} / {models.length} 个模型</p></div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">排序</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md border border-border bg-surface px-2 py-1.5">
            <option value="ref">参考分</option><option value="updated">更新日期</option><option value="params">参数量</option><option value="price">价格</option><option value="elo">Elo</option><option value="name">名称</option>
          </select>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="card p-3 space-y-4 text-xs h-fit lg:sticky lg:top-20">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索…" className="w-full rounded-md bg-surface-2 px-3 py-1.5 text-sm outline-none" aria-label="搜索模型" />
          <F title="开放性">
            {([['all', '全部'], ['open', '开源'], ['closed', '闭源'], ['weights', '权重可下'], ['api', '仅 API']] as const).map(([k, l]) => <Chip key={k} active={open === k} onClick={() => setOpen(k)}>{l}</Chip>)}
          </F>
          <F title="厂商">{vendors().map((v) => <Chip key={v} active={vendor.includes(v)} onClick={() => tog(vendor, setVendor, v)}>{v}</Chip>)}</F>
          <F title="体量（总参数）">{sizeBuckets.map(([l]) => <Chip key={l} active={size.includes(l)} onClick={() => tog(size, setSize, l)}>{l}</Chip>)}</F>
          <F title="许可证">
            {([['all', '全部'], ['mit', 'MIT'], ['apache', 'Apache-2.0'], ['commercial', '可商用'], ['restricted', '限制性']] as const).map(([k, l]) => <Chip key={k} active={lic === k} onClick={() => setLic(k)}>{l}</Chip>)}
          </F>
          <F title="模态"><Chip active={mod.includes('image')} onClick={() => tog(mod, setMod, 'image')}>视觉</Chip><Chip active={mod.includes('tools')} onClick={() => tog(mod, setMod, 'tools')}>工具调用</Chip></F>
          <F title="硬件（开源 Q4）">{([16, 24, 80] as const).map((g) => <Chip key={g} active={hw === g} onClick={() => setHw(hw === g ? 0 : g)}>能进 {g}GB</Chip>)}</F>
          <F title="推理"><Chip active={think} onClick={() => setThink(!think)}>推理模型 (thinking)</Chip></F>
          <Button variant="outline" onClick={reset} className="w-full text-xs">清空筛选</Button>
        </aside>
        <div>
          {list.length === 0 ? <Empty text="没有匹配的模型" action={<Button variant="outline" onClick={reset}>清空筛选</Button>} /> : (
            <div className="card overflow-x-auto">
              <table className="tbl w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-muted"><tr className="border-b border-border">
                  <th className="px-3 py-2 text-left">模型</th><th className="px-2 py-2 text-left">开闭源</th><th className="px-2 py-2 text-right">参考分</th><th className="px-2 py-2 text-left hidden md:table-cell">参数</th><th className="px-2 py-2 text-right hidden sm:table-cell">上下文</th><th className="px-2 py-2 text-right">价格</th><th className="px-2 py-2 text-right hidden md:table-cell">Q4</th><th className="px-2 py-2 text-left hidden lg:table-cell">许可证</th>
                </tr></thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 hover:bg-surface-2/60">
                      <td className="px-3 py-2 min-w-[200px]">
                        <ModelName m={m} />
                        <div className="mt-1 flex gap-1">{m.complete ? <Badge tone="info">完整说明书</Badge> : <Badge>速览</Badge>}{m.status === 'superseded' && <Badge tone="warn">已被替代</Badge>}{m.reasoning_mode !== 'none' && <Badge>推理</Badge>}{m.modalities.includes('image') && <Badge>视觉</Badge>}</div>
                      </td>
                      <td className="px-2 py-2"><OpennessBadge m={m} /></td>
                      <td className="px-2 py-2 text-right num">{refs.get(m.id)?.score?.toFixed(1) ?? <span className="text-muted">—</span>}</td>
                      <td className="px-2 py-2 hidden md:table-cell text-xs">{formatParams(m.architecture.total_params, m.architecture.active_params)}</td>
                      <td className="px-2 py-2 text-right num hidden sm:table-cell">{m.context.display}</td>
                      <td className="px-2 py-2 text-right num whitespace-nowrap">{priceLabel(m)}</td>
                      <td className="px-2 py-2 text-right num hidden md:table-cell">{formatGB(m.memory.weight_gb.q4)}</td>
                      <td className={cx('px-2 py-2 hidden lg:table-cell text-xs', m.license_commercial !== true && 'text-community')}>{m.license}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">「速览」模型只有顶栏、分数与链接，说明书缺节显示「完善中」。<Link to="/about" className="link">如何贡献</Link></p>
        </div>
      </div>
    </div>
  )
}

function F({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">{title}</div><div className="flex flex-wrap gap-1.5">{children}</div></div>
}
