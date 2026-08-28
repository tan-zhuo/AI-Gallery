import { useMemo, useState } from 'react'
import { models, scoreMap, benchmarks } from '@/lib/catalog'
import { useCompareIds, MAX_COMPARE } from '@/hooks/useCompare'
import { filterModels } from '@/lib/search'
import { getScore, computeReferenceScores, isOpenWeights } from '@/lib/scoring'
import { formatParams, formatGB, priceLabel, cx } from '@/lib/format'
import { fitsIn } from '@/lib/vram'
import { OpennessBadge, LicenseBadge, Badge } from '@/components/ui/Badge'
import { EvidenceTag } from '@/components/ui/EvidenceTag'
import { Button, Empty } from '@/components/ui/Misc'
import { CapabilityRadar } from '@/components/charts/Radar'
import { radarFor } from '@/lib/capabilities'
import type { Model } from '@/lib/types'
import { Link } from 'react-router-dom'
import { VendorLogo } from '@/components/ui/VendorLogo'
import { useSeo } from '@/hooks/useSeo'


const COLORS = ['var(--accent)', 'var(--open)', 'var(--community)', 'var(--down)']

export default function Compare() {
  const [ids, setIds] = useCompareIds()
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(false)
  const sel = ids.map((id) => models.find((m) => m.id === id)).filter((m): m is Model => !!m)
  useSeo({ title: sel.length ? `对比：${sel.map((m) => m.name).join(' vs ')}` : '模型对比台', description: '并排对比最多 4 个 AI 模型：许可证、参数、架构、上下文、显存、价格与评测分数。', path: '/compare' })
  const refs = useMemo(() => computeReferenceScores(models, scoreMap), [])
  const cands = q ? filterModels(models, q).filter((m) => !ids.includes(m.id)).slice(0, 6) : []
  const share = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* noop */ } }
  const remove = (id: string) => setIds(ids.filter((x) => x !== id))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-semibold tracking-tight">对比台</h1><p className="text-xs text-muted mt-1">最多 {MAX_COMPARE} 个。选择状态只存在 URL 里，复制即可分享。</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={share} disabled={!sel.length}>{copied ? '已复制' : '复制分享链接'}</Button>
          {sel.length > 0 && <Button variant="ghost" onClick={() => setIds([])}>清空</Button>}
        </div>
      </div>
      {sel.length < MAX_COMPARE && (
        <div className="relative max-w-md">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="添加模型…" className="ctl ctl-block" aria-label="添加模型" />
          {cands.length > 0 && (
            <ul className="popover left-0 w-full p-1 overflow-hidden">
              {cands.map((m) => <li key={m.id}><button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => { setIds([...ids, m.id]); setQ('') }}><OpennessBadge m={m} />{m.name}<span className="text-xs text-muted">{m.vendor}</span></button></li>)}
            </ul>
          )}
        </div>
      )}
      {sel.length === 0 ? <Empty text="从榜单勾选模型，或在上方搜索添加。" action={<Button to="/leaderboard" variant="outline">去排行榜</Button>} /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border align-top">
                <th className="w-40 px-3 py-3 text-left text-[11px] uppercase tracking-wide text-muted">维度</th>
                {sel.map((m, i) => (
                  <th key={m.id} className="px-3 py-3 text-left font-normal min-w-[180px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0"><VendorLogo vendor={m.vendor} size={32} /><div className="min-w-0"><Link to={`/models/${m.id}`} className="font-semibold hover:underline" style={{ color: COLORS[i] }}>{m.name}</Link><div className="text-xs text-muted">{m.vendor}</div></div></div>
                      <button type="button" onClick={() => remove(m.id)} className="text-muted hover:text-text text-xs" aria-label="移除">✕</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Block title="身份与许可" />
              <R label="开闭源" cells={sel.map((m) => <OpennessBadge m={m} />)} />
              <R label="权重" cells={sel.map((m) => m.weights_available ? <a className="link" href={m.weights_url} target="_blank" rel="noreferrer">可下载</a> : '仅 API')} />
              <R label="许可证" cells={sel.map((m) => <LicenseBadge m={m} />)} />
              <R label="状态" cells={sel.map((m) => m.status)} />
              <R label="发布" cells={sel.map((m) => m.released_at ?? '—')} mono />
              <Block title="体量与架构" />
              <R label="参数" cells={sel.map((m) => formatParams(m.architecture.total_params, m.architecture.active_params))} mono />
              <R label="类型" cells={sel.map((m) => m.architecture.undisclosed && m.architecture.type === 'unknown' ? '未披露' : m.architecture.type.toUpperCase())} />
              <R label="注意力" cells={sel.map((m) => m.architecture.attention ?? '未披露')} />
              <R label="上下文" cells={sel.map((m) => m.context.display)} mono better={sel.map((m) => m.context.max_tokens ?? 0)} />
              <R label="推理模式" cells={sel.map((m) => ({ none: '无', optional: '可开关', 'default-on': '默认开' })[m.reasoning_mode])} />
              <R label="模态" cells={sel.map((m) => m.modalities.filter((x) => x !== 'text' && x !== 'tools').join(' / ') || '文本')} />
              <Block title="显存与价格" />
              <R label="BF16 权重" cells={sel.map((m) => formatGB(m.memory.weight_gb.bf16))} mono />
              <R label="Q4 权重" cells={sel.map((m) => formatGB(m.memory.weight_gb.q4))} mono better={sel.map((m) => m.memory.weight_gb.q4 ? -m.memory.weight_gb.q4 : undefined)} />
              <R label="单卡 24GB" cells={sel.map((m) => isOpenWeights(m) ? (fitsIn(m, 24) ? <Badge tone="open">可跑</Badge> : '不可') : '—')} />
              <R label="价格 in / out" cells={sel.map((m) => priceLabel(m))} mono better={sel.map((m) => m.pricing?.input_per_m ? -m.pricing.input_per_m : undefined)} />
              <Block title="分数" />
              <R label="综合参考分" cells={sel.map((m) => refs.get(m.id)?.score?.toFixed(1) ?? '—')} mono better={sel.map((m) => refs.get(m.id)?.score)} />
              {benchmarks.map((b) => {
                const rows = sel.map((m) => getScore(scoreMap, m.id, b.key))
                if (rows.every((r) => !r)) return null
                return <R key={b.key} label={b.name} cells={rows.map((r) => r ? <span className="inline-flex items-center gap-1.5">{r.value}<EvidenceTag level={r.evidence} compact /></span> : '—')} mono better={rows.map((r) => r?.value)} />
              })}
              <Block title="适合 / 不适合" />
              <R label="适合" cells={sel.map((m) => <ul className="list-disc pl-4 text-xs space-y-0.5">{m.copy.best_for.map((x) => <li key={x}>{x}</li>)}</ul>)} />
              <R label="不适合" cells={sel.map((m) => <ul className="list-disc pl-4 text-xs space-y-0.5">{m.copy.not_for.map((x) => <li key={x}>{x}</li>)}</ul>)} />
              <R label="坑" cells={sel.map((m) => <ul className="list-disc pl-4 text-xs space-y-0.5">{m.copy.pitfalls.map((x) => <li key={x}>{x}</li>)}</ul>)} />
              <Block title="外链" />
              <R label="链接" cells={sel.map((m) => <div className="flex flex-wrap gap-2 text-xs">{m.links.official && <a className="link" href={m.links.official} target="_blank" rel="noreferrer">官方</a>}{m.links.hf && <a className="link" href={m.links.hf} target="_blank" rel="noreferrer">HF</a>}{m.links.paper && <a className="link" href={m.links.paper} target="_blank" rel="noreferrer">论文</a>}{m.links.pricing && <a className="link" href={m.links.pricing} target="_blank" rel="noreferrer">定价</a>}</div>)} />
            </tbody>
          </table>
        </div>
      )}
      {sel.length >= 2 && (
        <div className="card p-4 h-[360px]">
          <div className="text-xs text-muted mb-1">能力雷达（基准原始值；Elo 按 1200–1520 归一）</div>
          <div className="h-[320px]"><CapabilityRadar data={radarFor(sel[0])} series={sel.map((m, i) => ({ name: m.name, color: COLORS[i], data: radarFor(m) }))} /></div>
        </div>
      )}
    </div>
  )
}

function Block({ title }: { title: string }) {
  return <tr className="bg-surface-2/50"><td colSpan={5} className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted">{title}</td></tr>
}
function R({ label, cells, mono, better }: { label: string; cells: React.ReactNode[]; mono?: boolean; better?: Array<number | undefined> }) {
  const max = better ? Math.max(...better.filter((v): v is number => v != null)) : undefined
  const distinct = better ? new Set(better.filter((v) => v != null)).size > 1 : false
  return (
    <tr className="border-b border-border/60 align-top">
      <td className="px-3 py-2 text-xs text-muted">{label}</td>
      {cells.map((c, i) => <td key={i} className={cx('px-3 py-2', mono && 'num', distinct && better?.[i] === max && 'bg-[var(--open-bg)]')}>{c ?? '—'}</td>)}
    </tr>
  )
}
