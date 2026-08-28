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
import { useColResize } from '@/components/ui/useColResize'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Model } from '@/lib/types'
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/i18n'

const sizeBuckets = [['≤8B', 0, 8], ['8–32B', 8, 32], ['32–70B', 32, 70], ['70–200B', 70, 200], ['200B–1T', 200, 1000], ['1T+', 1000, Infinity]] as const
const g = (m: Model, k: string) => getScore(scoreMap, m.id, k)?.value
const pB = (m: Model) => m.architecture.total_params_b ?? paramsB(m.architecture.total_params)
const first = (m: Model, ks: string[]) => { for (const k of ks) { const v = g(m, k); if (v != null) return v } return undefined }

/** 排序键：label 为中文原文（经 t()），get 返回可比较数值/字符串，dir 默认方向 */
const SORTS: Array<{ key: string; label: string; get: (m: Model, refs: Map<string, { score?: number }>) => number | string | undefined; dir: 'desc' | 'asc'; group: string }> = [
  { key: 'ref', label: '综合参考分', get: (m, r) => r.get(m.id)?.score, dir: 'desc', group: '评分' },
  { key: 'elo', label: 'Arena Elo', get: (m) => g(m, 'arena_text'), dir: 'desc', group: '评分' },
  { key: 'zh', label: '中文 Elo', get: (m) => g(m, 'arena_zh'), dir: 'desc', group: '评分' },
  { key: 'aa', label: 'AA 指数', get: (m) => g(m, 'aa_index'), dir: 'desc', group: '评分' },
  { key: 'coding', label: '代码（SWE / LCB）', get: (m) => first(m, ['swe_verified', 'livecodebench', 'scicode']), dir: 'desc', group: '评分' },
  { key: 'reasoning', label: '推理（GPQA）', get: (m) => g(m, 'gpqa_diamond'), dir: 'desc', group: '评分' },
  { key: 'hle', label: 'HLE', get: (m) => g(m, 'hle'), dir: 'desc', group: '评分' },
  { key: 'math', label: '数学（AIME）', get: (m) => first(m, ['aime_2025', 'aime_2026']), dir: 'desc', group: '评分' },
  { key: 'agent', label: 'Agent（τ² / TB）', get: (m) => first(m, ['tau2_bench', 'terminal_bench', 'tb_hard', 'tau3_banking']), dir: 'desc', group: '评分' },
  { key: 'mm', label: '多模态（MMMU）', get: (m) => first(m, ['mmmu', 'mmmu_pro']), dir: 'desc', group: '评分' },
  { key: 'released', label: '发布日期', get: (m) => m.released_at, dir: 'desc', group: '时间' },
  { key: 'updated', label: '数据更新', get: (m) => m.updated_at, dir: 'desc', group: '时间' },
  { key: 'params', label: '总参数', get: (m) => pB(m), dir: 'desc', group: '规格' },
  { key: 'active', label: '激活参数', get: (m) => m.architecture.active_params_b ?? paramsB(m.architecture.active_params) ?? pB(m), dir: 'desc', group: '规格' },
  { key: 'ctx', label: '上下文', get: (m) => m.context.max_tokens, dir: 'desc', group: '规格' },
  { key: 'q4', label: 'Q4 显存', get: (m) => m.memory.weight_gb.q4 ?? (pB(m) != null ? pB(m)! * 0.58 : undefined), dir: 'asc', group: '规格' },
  { key: 'pin', label: '输入价格', get: (m) => m.pricing?.input_per_m, dir: 'asc', group: '价格' },
  { key: 'pout', label: '输出价格', get: (m) => m.pricing?.output_per_m, dir: 'asc', group: '价格' },
  { key: 'tok', label: 'API tok/s', get: (m) => m.runtime?.tok_s, dir: 'desc', group: '价格' },
  { key: 'ttft', label: '首 token 延迟', get: (m) => m.runtime?.latency_s, dir: 'asc', group: '价格' },
  { key: 'name', label: '名称', get: (m) => m.name.toLowerCase(), dir: 'asc', group: '其它' },
  { key: 'vendor', label: '厂商', get: (m) => m.vendor, dir: 'asc', group: '其它' },
]
const COL_SORT: Record<string, string> = { model: 'name', ref: 'ref', released: 'released', params: 'params', ctx: 'ctx', price: 'pin', q4: 'q4' }

interface Filters {
  open: 'all' | 'open' | 'closed' | 'weights' | 'api'
  vendor: string[]; size: string[]; lic: 'all' | 'mit' | 'apache' | 'commercial' | 'restricted' | 'noncommercial'
  mod: string[]; hw: 0 | 16 | 24 | 80; reasoning: 'any' | 'none' | 'optional' | 'default-on'
  arch: 'any' | 'dense' | 'moe' | 'hybrid'; ctxMin: number; year: string[]
  status: 'all' | 'current' | 'preview' | 'superseded'; sheet: 'any' | 'complete'
  priceMax: number; evidence: 'any' | 'independent'
  fmt: string[]
}
const DEF: Filters = { open: 'all', vendor: [], size: [], lic: 'all', mod: [], hw: 0, reasoning: 'any', arch: 'any', ctxMin: 0, year: [], status: 'all', sheet: 'any', priceMax: 0, evidence: 'any', fmt: [] }

export default function Models() {
  const { t } = useT()
  useSeo({ title: t('模型库'), description: t('按开闭源、厂商、体量、许可证、硬件筛选 {n} 个 AI 模型，含发布日期、参数、上下文、价格与 Q4 显存。', { n: models.length }), path: '/models' })
  const [q, setQ] = useState('')
  const [f, setF] = useState<Filters>(DEF)
  const set = (p: Partial<Filters>) => setF((s) => ({ ...s, ...p }))
  const tog = (k: 'vendor' | 'size' | 'mod' | 'year' | 'fmt', v: string) => set({ [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] } as Partial<Filters>)
  const [sortKey, setSortKey] = useLocalStorage<string>('mb_models_sort', 'ref')
  const [dir, setDir] = useLocalStorage<'asc' | 'desc'>('mb_models_dir', 'desc')
  const [page, setPage] = useState(1)
  const [PAGE, setPageSize] = useLocalStorage<number>('mb_page_size', 40)
  const COLS = ['model', 'open', 'ref', 'released', 'params', 'ctx', 'price', 'q4', 'license']
  const { ref: tref, thProps, Handle, tableStyle } = useColResize('models', COLS)
  const refs = useMemo(() => computeReferenceScores(models, scoreMap), [])
  const sortDef = SORTS.find((s) => s.key === sortKey) ?? SORTS[0]
  const pickSort = (k: string) => { const d = SORTS.find((s) => s.key === k)!; if (k === sortKey) setDir(dir === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setDir(d.dir) } }

  const list = useMemo(() => {
    let ms = filterModels(models, q)
    ms = ms.filter((m) => {
      if (f.status === 'current' && m.status !== 'current') return false
      if (f.status === 'preview' && m.status !== 'preview') return false
      if (f.status === 'superseded' && m.status !== 'superseded') return false
      if (f.open === 'open' && !isOpenWeights(m)) return false
      if (f.open === 'closed' && isOpenWeights(m)) return false
      if (f.open === 'weights' && !m.weights_available) return false
      if (f.open === 'api' && m.weights_available) return false
      if (f.vendor.length && !f.vendor.includes(m.vendor)) return false
      if (f.size.length) { const p = pB(m); if (p == null || !sizeBuckets.some(([l, lo, hi]) => f.size.includes(l) && p > lo && p <= hi)) return false }
      if (f.lic === 'mit' && !/mit/i.test(m.license)) return false
      if (f.lic === 'apache' && !/apache/i.test(m.license)) return false
      if (f.lic === 'commercial' && m.license_commercial !== true) return false
      if (f.lic === 'restricted' && m.license_commercial !== 'restricted') return false
      if (f.lic === 'noncommercial' && m.license_commercial !== false) return false
      for (const md of f.mod) if (!m.modalities.includes(md as Model['modalities'][number])) return false
      if (f.hw && !(isOpenWeights(m) && fitsIn(m, f.hw))) return false
      if (f.reasoning !== 'any' && m.reasoning_mode !== f.reasoning) return false
      if (f.arch !== 'any' && m.architecture.type !== f.arch) return false
      if (f.ctxMin && (m.context.max_tokens ?? 0) < f.ctxMin) return false
      if (f.year.length && !f.year.includes((m.released_at ?? '').slice(0, 4))) return false
      if (f.sheet === 'complete' && !m.complete) return false
      if (f.priceMax && !(m.pricing?.input_per_m != null && m.pricing.input_per_m <= f.priceMax)) return false
      if (f.evidence === 'independent' && !(g(m, 'aa_index') != null || g(m, 'arena_text') != null)) return false
      for (const k of f.fmt) if (!m.variants?.some((v) => v.kind === k)) return false
      return true
    })
    if (!q.trim()) {
      const sgn = dir === 'asc' ? 1 : -1
      ms = [...ms].sort((a, b) => {
        const va = sortDef.get(a, refs), vb = sortDef.get(b, refs)
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        return (typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)) * sgn
      })
    }
    return ms
  }, [q, f, sortDef, dir, refs])
  useEffect(() => { setPage(1) }, [q, f, sortKey, dir, PAGE])
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const cur = Math.min(page, pages)
  const paged = list.slice((cur - 1) * PAGE, cur * PAGE)
  const reset = () => { setQ(''); setF(DEF) }
  const active = Object.keys(DEF).filter((k) => JSON.stringify(f[k as keyof Filters]) !== JSON.stringify(DEF[k as keyof Filters])).length
  const years = [...new Set(models.map((m) => (m.released_at ?? '').slice(0, 4)).filter((y) => y.length === 4))].sort().reverse()
  const groups = [...new Set(SORTS.map((s) => s.group))]
  const SortIcon = ({ k }: { k: string }) => (sortKey === k ? <span className="ml-1 text-accent">{dir === 'asc' ? '↑' : '↓'}</span> : null)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">{t('模型库')}</h1><p className="text-xs text-muted mt-1">{t('{a} / {b} 个模型', { a: list.length, b: models.length })}{active > 0 && <> · {t('{n} 个筛选生效', { n: active })}</>}</p></div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">{t('排序')}</span>
          <select value={sortKey} onChange={(e) => { const d = SORTS.find((s) => s.key === e.target.value)!; setSortKey(d.key); setDir(d.dir) }} className="ctl">
            {groups.map((gr) => <optgroup key={gr} label={t(gr)}>{SORTS.filter((s) => s.group === gr).map((s) => <option key={s.key} value={s.key}>{t(s.label)}</option>)}</optgroup>)}
          </select>
          <button type="button" onClick={() => setDir(dir === 'asc' ? 'desc' : 'asc')} className="ctl w-9 justify-center px-0 num" title={dir === 'asc' ? t('升序') : t('降序')} aria-label={t('切换排序方向')}>{dir === 'asc' ? '↑' : '↓'}</button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <aside className="card p-3 space-y-4 text-xs h-fit lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('搜索…')} className="ctl ctl-block" aria-label={t('搜索模型')} />
          <F title={t('状态')}>{([['all', '全部'], ['current', '当前代'], ['preview', 'Preview'], ['superseded', '已被替代']] as const).map(([k, l]) => <Chip key={k} active={f.status === k} onClick={() => set({ status: k })}>{t(l)}</Chip>)}</F>
          <F title={t('开放性')}>{([['all', '全部'], ['open', '开源'], ['closed', '闭源'], ['weights', '权重可下'], ['api', '仅 API']] as const).map(([k, l]) => <Chip key={k} active={f.open === k} onClick={() => set({ open: k })}>{t(l)}</Chip>)}</F>
          <F title={t('发布年份')}>{years.map((y) => <Chip key={y} active={f.year.includes(y)} onClick={() => tog('year', y)}>{y}</Chip>)}</F>
          <F title={t('厂商')}>{vendors().map((v) => <Chip key={v} active={f.vendor.includes(v)} onClick={() => tog('vendor', v)}>{v}</Chip>)}</F>
          <F title={t('体量（总参数）')}>{sizeBuckets.map(([l]) => <Chip key={l} active={f.size.includes(l)} onClick={() => tog('size', l)}>{l}</Chip>)}</F>
          <F title={t('架构')}>{([['any', '全部'], ['dense', 'Dense'], ['moe', 'MoE'], ['hybrid', 'Hybrid']] as const).map(([k, l]) => <Chip key={k} active={f.arch === k} onClick={() => set({ arch: k })}>{t(l)}</Chip>)}</F>
          <F title={t('上下文 ≥')}>{([[0, '任意'], [32768, '32K'], [131072, '128K'], [262144, '256K'], [1048576, '1M']] as const).map(([k, l]) => <Chip key={k} active={f.ctxMin === k} onClick={() => set({ ctxMin: k })}>{t(l)}</Chip>)}</F>
          <F title={t('许可证')}>{([['all', '全部'], ['mit', 'MIT'], ['apache', 'Apache-2.0'], ['commercial', '可商用'], ['restricted', '限制性'], ['noncommercial', '不可商用']] as const).map(([k, l]) => <Chip key={k} active={f.lic === k} onClick={() => set({ lic: k })}>{t(l)}</Chip>)}</F>
          <F title={t('模态')}>{([['image', '视觉'], ['video', '视频'], ['audio', '音频'], ['tools', '工具调用'], ['computer-use', '计算机使用']] as const).map(([k, l]) => <Chip key={k} active={f.mod.includes(k)} onClick={() => tog('mod', k)}>{t(l)}</Chip>)}</F>
          <F title={t('推理模式')}>{([['any', '全部'], ['none', '无思考'], ['optional', '可开关'], ['default-on', '默认开']] as const).map(([k, l]) => <Chip key={k} active={f.reasoning === k} onClick={() => set({ reasoning: k })}>{t(l)}</Chip>)}</F>
          <F title={t('硬件（开源 Q4）')}>{([16, 24, 80] as const).map((gb) => <Chip key={gb} active={f.hw === gb} onClick={() => set({ hw: f.hw === gb ? 0 : gb })}>{t('能进 {g}GB', { g: gb })}</Chip>)}</F>
          <F title={t('输入价格 ≤ $/1M')}>{([[0, '任意'], [0.5, '0.5'], [1, '1'], [3, '3'], [10, '10']] as const).map(([k, l]) => <Chip key={k} active={f.priceMax === k} onClick={() => set({ priceMax: k })}>{k === 0 ? t(l) : `$${l}`}</Chip>)}</F>
          <F title={t('下载格式')}>{([['gguf', 'GGUF'], ['mlx', 'MLX'], ['fp8', 'FP8'], ['awq', 'AWQ'], ['gptq', 'GPTQ'], ['nvfp4', 'NVFP4']] as const).map(([k, l]) => <Chip key={k} active={f.fmt.includes(k)} onClick={() => tog('fmt', k)}>{l}</Chip>)}</F>
          <F title={t('数据')}><Chip active={f.sheet === 'complete'} onClick={() => set({ sheet: f.sheet === 'complete' ? 'any' : 'complete' })}>{t('有完整说明书')}</Chip><Chip active={f.evidence === 'independent'} onClick={() => set({ evidence: f.evidence === 'independent' ? 'any' : 'independent' })}>{t('有独立复测')}</Chip></F>
          <Button variant="outline" onClick={reset} className="w-full">{t('清空筛选')}{active > 0 && ` (${active})`}</Button>
        </aside>
        <div>
          {list.length === 0 ? <Empty text={t('没有匹配的模型')} action={<Button variant="outline" onClick={reset}>{t('清空筛选')}</Button>} /> : (
            <div className="card overflow-x-auto">
              <table ref={tref} style={tableStyle} className="tbl w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-muted"><tr className="border-b border-border">
                  {([['model', '模型', 'text-left px-3'], ['open', '开闭源', 'text-left'], ['ref', '参考分', 'text-right'], ['released', '发布', 'text-right num'], ['params', '参数', 'text-left hidden md:table-cell'], ['ctx', '上下文', 'text-right hidden sm:table-cell'], ['price', '价格', 'text-right'], ['q4', 'Q4', 'text-right hidden md:table-cell'], ['license', '许可证', 'text-left hidden lg:table-cell']] as const).map(([k, l, cls]) => (
                    <th key={k} {...thProps(k)} className={cx('px-2 py-2 select-none', cls, COL_SORT[k] && 'cursor-pointer hover:text-text')} onClick={COL_SORT[k] ? () => pickSort(COL_SORT[k]) : undefined} title={COL_SORT[k] ? t('点击排序') : undefined}>
                      {k === 'q4' ? 'Q4' : t(l)}{COL_SORT[k] && <SortIcon k={COL_SORT[k]} />}{k !== 'license' && <Handle k={k} />}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {paged.map((m) => (
                    <tr key={m.id} className={cx('border-b border-border/60', m.status === 'superseded' && 'opacity-70')}>
                      <td className="px-3 py-2 min-w-[200px]">
                        <ModelName m={m} />
                        <div className="mt-1 flex flex-wrap gap-1">{m.complete ? <Badge tone="info">{t('完整说明书')}</Badge> : <Badge>{t('速览')}</Badge>}{m.status === 'superseded' && <Badge tone="warn">{t('已被替代')}</Badge>}{m.status === 'preview' && <Badge tone="warn">Preview</Badge>}{m.reasoning_mode !== 'none' && <Badge>{t('推理')}</Badge>}{m.modalities.includes('image') && <Badge>{t('视觉')}</Badge>}{m.architecture.type === 'moe' && <Badge>MoE</Badge>}</div>
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
          {list.length > 20 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted num">{t('第 {a}–{b} 条，共 {c} 条', { a: (cur - 1) * PAGE + 1, b: Math.min(cur * PAGE, list.length), c: list.length })}</span>
                <select value={PAGE} onChange={(e) => setPageSize(+e.target.value)} className="ctl ctl-sm" aria-label={t('每页条数')}>
                  {[20, 40, 100, 200, 500].map((n) => <option key={n} value={n}>{t('{n} / 页', { n })}</option>)}
                </select>
              </div>
              {pages > 1 && <div className="seg seg-sm">
                <button type="button" onClick={() => setPage(cur - 1)} disabled={cur === 1} className="disabled:opacity-40">‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} type="button" aria-pressed={n === cur} onClick={() => setPage(n)} className="num">{n}</button>)}
                <button type="button" onClick={() => setPage(cur + 1)} disabled={cur === pages} className="disabled:opacity-40">›</button>
              </div>}
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
