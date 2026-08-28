import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { models, scoreMap, vendors } from '@/lib/catalog'
import { filterModels } from '@/lib/search'
import { computeReferenceScores, getScore, isOpenWeights } from '@/lib/scoring'
import { fitsIn } from '@/lib/vram'
import { paramsB, priceLabel, tParams, formatGB, cx } from '@/lib/format'
import { OpennessBadge, Badge } from '@/components/ui/Badge'
import { ModelName } from '@/components/ui/ModelName'
import { Empty, Button, Chip } from '@/components/ui/Misc'
import type { Model } from '@/lib/types'
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/i18n'


type Sort = 'ref' | 'released' | 'updated' | 'params' | 'price' | 'elo' | 'name'
const sizeBuckets = [['≤8B', 0, 8], ['8–32B', 8, 32], ['32–70B', 32, 70], ['70B+', 70, Infinity]] as const

export default function Models() {
  const { t } = useT()
  useSeo({ title: t('模型库'), description: t('按开闭源、厂商、体量、许可证、硬件筛选 {n} 个 AI 模型，含发布日期、参数、上下文、价格与 Q4 显存。', { n: models.length }), path: '/models' })
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<'all' | 'open' | 'closed' | 'weights' | 'api'>('all')
  const [vendor, setVendor] = useState<string[]>([])
  const [size, setSize] = useState<string[]>([])
  const [lic, setLic] = useState<'all' | 'mit' | 'apache' | 'commercial' | 'restricted'>('all')
  const [mod, setMod] = useState<string[]>([])
  const [hw, setHw] = useState<0 | 16 | 24 | 80>(0)
  const [think, setThink] = useState(false)
  const [old, setOld] = useState(true)
  const [page, setPage] = useState(1)
  const PAGE = 40
  const [sort, setSort] = useState<Sort>('ref')
  const refs = useMemo(() => computeReferenceScores(models, scoreMap), [])
  const list = useMemo(() => {
    let ms = filterModels(models, q)
    ms = ms.filter((m) => {
      if (!old && m.status === 'superseded') return false
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
      released: (a, b) => (b.released_at ?? '').localeCompare(a.released_at ?? ''),
      updated: (a, b) => b.updated_at.localeCompare(a.updated_at),
      params: (a, b) => (b.architecture.total_params_b ?? paramsB(b.architecture.total_params) ?? -1) - (a.architecture.total_params_b ?? paramsB(a.architecture.total_params) ?? -1),
      price: (a, b) => (a.pricing?.input_per_m ?? 1e9) - (b.pricing?.input_per_m ?? 1e9),
      elo: (a, b) => (g(b, 'arena_text') ?? -1) - (g(a, 'arena_text') ?? -1),
      name: (a, b) => a.name.localeCompare(b.name),
    }
    if (!q.trim()) ms = [...ms].sort(cmp[sort])
    return ms
  }, [q, open, vendor, size, lic, mod, hw, think, old, sort, refs])
  useEffect(() => { setPage(1) }, [q, open, vendor, size, lic, mod, hw, think, old, sort])
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const cur = Math.min(page, pages)
  const paged = list.slice((cur - 1) * PAGE, cur * PAGE)
  const reset = () => { setQ(''); setOpen('all'); setVendor([]); setSize([]); setLic('all'); setMod([]); setHw(0); setThink(false); setOld(true) }
  const tog = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">{t('模型库')}</h1><p className="text-xs text-muted mt-1">{t('{a} / {b} 个模型', { a: list.length, b: models.length })}{!old && <> · {t('已隐藏 {n} 个旧代', { n: models.filter((m) => m.status === 'superseded').length })}</>}</p></div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">{t('排序')}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="ctl">
            <option value="ref">{t('参考分')}</option><option value="released">{t('发布日期')}</option><option value="updated">{t('更新日期')}</option><option value="params">{t('参数量')}</option><option value="price">{t('价格')}</option><option value="elo">Elo</option><option value="name">{t('名称')}</option>
          </select>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="card p-3 space-y-4 text-xs h-fit lg:sticky lg:top-20">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('搜索…')} className="ctl ctl-block" aria-label={t('搜索模型')} />
          <F title={t('开放性')}>
            {([['all', '全部'], ['open', '开源'], ['closed', '闭源'], ['weights', '权重可下'], ['api', '仅 API']] as const).map(([k, l]) => <Chip key={k} active={open === k} onClick={() => setOpen(k)}>{t(l)}</Chip>)}
          </F>
          <F title={t('厂商')}>{vendors().map((v) => <Chip key={v} active={vendor.includes(v)} onClick={() => tog(vendor, setVendor, v)}>{v}</Chip>)}</F>
          <F title={t('体量（总参数）')}>{sizeBuckets.map(([l]) => <Chip key={l} active={size.includes(l)} onClick={() => tog(size, setSize, l)}>{l}</Chip>)}</F>
          <F title={t('许可证')}>
            {([['all', '全部'], ['mit', 'MIT'], ['apache', 'Apache-2.0'], ['commercial', '可商用'], ['restricted', '限制性']] as const).map(([k, l]) => <Chip key={k} active={lic === k} onClick={() => setLic(k)}>{t(l)}</Chip>)}
          </F>
          <F title={t('模态')}><Chip active={mod.includes('image')} onClick={() => tog(mod, setMod, 'image')}>{t('视觉')}</Chip><Chip active={mod.includes('tools')} onClick={() => tog(mod, setMod, 'tools')}>{t('工具调用')}</Chip></F>
          <F title={t('硬件（开源 Q4）')}>{([16, 24, 80] as const).map((g) => <Chip key={g} active={hw === g} onClick={() => setHw(hw === g ? 0 : g)}>{t('能进 {g}GB', { g })}</Chip>)}</F>
          <F title={t('推理')}><Chip active={think} onClick={() => setThink(!think)}>{t('推理模型 (thinking)')}</Chip></F>
          <F title={t('代际')}><Chip active={!old} onClick={() => setOld(!old)}>{t('只看当前代')}</Chip></F>
          <Button variant="outline" onClick={reset} className="w-full">{t('清空筛选')}</Button>
        </aside>
        <div>
          {list.length === 0 ? <Empty text={t('没有匹配的模型')} action={<Button variant="outline" onClick={reset}>{t('清空筛选')}</Button>} /> : (
            <div className="card overflow-x-auto">
              <table className="tbl w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-muted"><tr className="border-b border-border">
                  <th className="px-3 py-2 text-left">{t('模型')}</th><th className="px-2 py-2 text-left">{t('开闭源')}</th><th className="px-2 py-2 text-right">{t('参考分')}</th><th className="px-2 py-2 text-right num">{t('发布')}</th><th className="px-2 py-2 text-left hidden md:table-cell">{t('参数')}</th><th className="px-2 py-2 text-right hidden sm:table-cell">{t('上下文')}</th><th className="px-2 py-2 text-right">{t('价格')}</th><th className="px-2 py-2 text-right hidden md:table-cell">Q4</th><th className="px-2 py-2 text-left hidden lg:table-cell">{t('许可证')}</th>
                </tr></thead>
                <tbody>
                  {paged.map((m) => (
                    <tr key={m.id} className={cx('border-b border-border/60', m.status === 'superseded' && 'opacity-70')}>
                      <td className="px-3 py-2 min-w-[200px]">
                        <ModelName m={m} />
                        <div className="mt-1 flex gap-1">{m.complete ? <Badge tone="info">{t('完整说明书')}</Badge> : <Badge>{t('速览')}</Badge>}{m.status === 'superseded' && <Badge tone="warn">{t('已被替代')}</Badge>}{m.reasoning_mode !== 'none' && <Badge>{t('推理')}</Badge>}{m.modalities.includes('image') && <Badge>{t('视觉')}</Badge>}</div>
                      </td>
                      <td className="px-2 py-2"><OpennessBadge m={m} /></td>
                      <td className="px-2 py-2 text-right num">{refs.get(m.id)?.score?.toFixed(1) ?? <span className="text-muted">—</span>}</td>
                      <td className="px-2 py-2 text-right num text-xs whitespace-nowrap">{m.released_at ?? '—'}</td>
                      <td className="px-2 py-2 hidden md:table-cell text-xs">{tParams(t, m.architecture.total_params, m.architecture.active_params)}</td>
                      <td className="px-2 py-2 text-right num hidden sm:table-cell">{m.context.display}</td>
                      <td className="px-2 py-2 text-right num whitespace-nowrap">{t(priceLabel(m))}</td>
                      <td className="px-2 py-2 text-right num hidden md:table-cell">{formatGB(m.memory.weight_gb.q4)}</td>
                      <td className={cx('px-2 py-2 hidden lg:table-cell text-xs', m.license_commercial !== true && 'text-community')}>{m.license}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted num">{t('第 {a}–{b} 条，共 {c} 条', { a: (cur - 1) * PAGE + 1, b: Math.min(cur * PAGE, list.length), c: list.length })}</span>
              <div className="seg seg-sm">
                <button type="button" onClick={() => setPage(cur - 1)} disabled={cur === 1} className="disabled:opacity-40">‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} type="button" aria-pressed={n === cur} onClick={() => setPage(n)} className="num">{n}</button>)}
                <button type="button" onClick={() => setPage(cur + 1)} disabled={cur === pages} className="disabled:opacity-40">›</button>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">{t('「速览」模型只有顶栏、分数与链接，说明书缺节显示「完善中」。')}<Link to="/about" className="link">{t('如何贡献')}</Link></p>
        </div>
      </div>
    </div>
  )
}

function F({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted">{title}</div><div className="flex flex-wrap gap-1.5">{children}</div></div>
}
