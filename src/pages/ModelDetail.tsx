import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getModel, getScores, models, scoreMap, getBenchmark } from '@/lib/catalog'
import { computeReferenceScores, getScore, isOpenWeights } from '@/lib/scoring'
import { fitsIn } from '@/lib/vram'
import { formatParams, priceLabel, formatGB, cx } from '@/lib/format'
import { BadgeRow, Badge } from '@/components/ui/Badge'
import { EvidenceTag } from '@/components/ui/EvidenceTag'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { Button, Stat, Empty } from '@/components/ui/Misc'
import { ArchDiagram } from '@/components/model/ArchDiagram'
import { CapabilityRadar } from '@/components/charts/Radar'
import { radarFor } from '@/lib/capabilities'
import { useCompareIds, MAX_COMPARE } from '@/hooks/useCompare'
import type { CapabilityKey, Model } from '@/lib/types'

const CAP_LABEL: Record<CapabilityKey, string> = { coding: '编程', reasoning: '推理', math: '数学', knowledge: '知识', instruction: '指令遵循', agent: 'Agent', multimodal: '多模态', chinese: '中文' }

export default function ModelDetail() {
  const { slug = '' } = useParams()
  const m = getModel(slug)
  if (!m) return <Empty text={`未找到模型「${slug}」`} action={<Button to="/models" variant="outline">去模型库</Button>} />
  return <Detail m={m} />
}

function Detail({ m }: { m: Model }) {
  const scores = getScores(m.id)
  const refs = useMemo(() => computeReferenceScores(models, scoreMap), [])
  const ref = refs.get(m.id)
  const single = isOpenWeights(m) && fitsIn(m, 24)
  const [ids, setIds] = useCompareIds()
  const inCmp = ids.includes(m.id)
  const g = (k: string) => getScore(scoreMap, m.id, k)
  const elo = g('arena_text'), aa = g('aa_index'), code = g('swe_verified') ?? g('livecodebench'), reason = g('gpqa_diamond')
  const a = m.architecture
  const family = models.filter((x) => x.id !== m.id && x.family && x.family === m.family)
  const succ = m.superseded_by ? getModel(m.superseded_by) : undefined
  const ctaLinks = isOpenWeights(m)
    ? [['Hugging Face', m.links.hf ?? m.weights_url], ['GitHub', m.links.github], ['技术报告', m.links.paper], ['官方', m.links.official]]
    : [['官方模型页', m.links.official], ['定价', m.links.pricing], ['发布公告', m.links.paper]]

  return (
    <div className="space-y-8">
      {/* A. 顶栏卡片 */}
      <div className="card p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4 min-w-0">
            <BadgeRow m={m} singleGpu={single} />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{m.name}</h1>
              <p className="text-sm text-muted mt-1">
                {m.name_zh && <>{m.name_zh} · </>}{m.vendor}{m.vendor_zh && ` ${m.vendor_zh}`} · 发布 <span className="num">{m.released_at ?? '—'}</span> · {m.status === 'current' ? '当前代' : m.status === 'preview' ? 'Preview' : m.status === 'superseded' ? <>已被替代{succ && <> → <Link className="link" to={`/models/${succ.id}`}>{succ.name}</Link></>}</> : '已停更'}
              </p>
            </div>
            <p className="text-base md:text-lg leading-relaxed">{m.copy.one_liner}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border pt-4">
              <Stat label="参数" value={<span className="text-base">{formatParams(a.total_params, a.active_params)}</span>} sub={a.type !== 'unknown' ? a.type.toUpperCase() : undefined} />
              <Stat label="上下文" value={m.context.display} sub={m.context.max_output ? `输出 ${Math.round(m.context.max_output / 1024)}K` : undefined} />
              <Stat label="价格 / 1M tok" value={<span className="text-base">{priceLabel(m)}</span>} sub={m.pricing?.source ? `${m.pricing.source.slice(0, 14)} · ${m.pricing.as_of}` : (m.weights_available ? '无官方 API' : undefined)} />
              <Stat label="推荐部署" value={<span className="text-base">{isOpenWeights(m) ? (single ? `Q4 · ${formatGB(m.memory.weight_gb.q4)} · 24GB` : m.memory.weight_gb.q4 ? `Q4 · ${formatGB(m.memory.weight_gb.q4)}` : '见说明书') : 'API'}</span>} sub={isOpenWeights(m) ? (single ? 'RTX 4090 / 3090' : m.memory.ref_hw_80gb ? '80GB+' : undefined) : '无自建选项'} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ScoreBar label="Arena Elo" value={elo ? Math.max(0, Math.min(100, ((elo.value - 1200) / 320) * 100)) : undefined} display={elo?.value.toString()} sub={elo?.as_of} />
              <ScoreBar label="AA 综合指数" value={aa?.value} sub={aa?.as_of} />
              <ScoreBar label={code ? getBenchmark(code.key)?.name_zh ?? '代码' : '代码'} value={code?.value} sub={code?.as_of} />
              <ScoreBar label="GPQA 推理" value={reason?.value} sub={reason?.as_of} />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {ctaLinks.filter(([, u]) => u).map(([l, u]) => <a key={l} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2">{l} ↗</a>)}
              <Button variant={inCmp ? 'outline' : 'primary'} onClick={() => setIds(inCmp ? ids.filter((x) => x !== m.id) : [...ids, m.id])} disabled={!inCmp && ids.length >= MAX_COMPARE}>{inCmp ? '已在对比中 ✓' : '加入对比'}</Button>
              {ids.length >= 2 && <Button variant="ghost" to={`/compare?ids=${ids.join(',')}`}>去对比（{ids.length}）→</Button>}
            </div>
          </div>
          <div className="hidden lg:block border-l border-border pl-6">
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">架构简图</div>
            <ArchDiagram m={m} />
          </div>
        </div>
      </div>

      {/* B. 设计说明书 */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block sticky top-20 h-fit text-sm space-y-1">
          {['架构', '参数与内存', '能力画像', '训练与推理行为', '亮点与坑', '生态与部署', '证据与榜单明细', '版本与家族'].map((t, i) => <a key={t} href={`#s${i + 1}`} className="block rounded-md px-2 py-1 text-muted hover:text-text hover:bg-surface-2">{i + 1}. {t}</a>)}
          {ref?.score != null && <div className="mt-4 rounded-lg border border-border p-3 text-xs"><div className="text-muted">综合参考分</div><div className="num text-xl font-semibold">{ref.score.toFixed(1)}</div>{ref.partial && <div className="text-community">部分数据</div>}<Link to="/methodology" className="link">算法</Link></div>}
        </nav>
        <div className="space-y-4 min-w-0">
          <Sec id="s1" n={1} title="架构" open>
            <div className="grid gap-4 md:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <D k="类型" v={a.type === 'unknown' ? '未披露' : { dense: 'Dense', moe: 'MoE', hybrid: 'Hybrid（线性 + 全注意力）' }[a.type]} />
                  <D k="注意力" v={a.attention ?? '未披露'} />
                  <D k="层数" v={a.layers ?? '未披露'} />
                  {a.type !== 'dense' && <D k="专家" v={a.experts ? `${a.experts} · 激活 ${a.active_experts}${a.shared_expert ? ' + 共享' : ''}` : '未披露'} />}
                  <D k="隐藏维" v={a.hidden_size ?? '未披露'} />
                  <D k="词表" v={a.vocab_size?.toLocaleString() ?? '未披露'} />
                </dl>
                {a.notes && <p className="text-sm text-muted leading-relaxed">{a.notes}</p>}
                <Md md={m.sheet?.architecture_md} />
              </div>
              <div className="lg:hidden md:block"><ArchDiagram m={m} /></div>
            </div>
          </Sec>
          <Sec id="s2" n={2} title="参数与内存" open>
            {isOpenWeights(m) ? (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="text-sm min-w-[420px]">
                    <thead className="text-[11px] uppercase tracking-wide text-muted"><tr><th className="text-left py-1 pr-4">精度</th><th className="text-right py-1 pr-4">权重大小</th><th className="text-left py-1">说明</th></tr></thead>
                    <tbody>
                      {(['bf16', 'fp8', 'q8', 'q4'] as const).map((q) => <tr key={q} className="border-t border-border/60"><td className="py-1 pr-4 num">{q.toUpperCase()}</td><td className="py-1 pr-4 num text-right">{formatGB(m.memory.weight_gb[q])}{m.memory.weight_gb[q] != null && m.memory.estimated && <span className="text-[10px] text-community ml-1">估</span>}</td><td className="py-1 text-xs text-muted">{m.memory.weight_gb[q] == null ? '暂无' : q === 'q4' ? 'GGUF Q4_K_M 或等效' : q === 'bf16' ? '官方精度' : ''}</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <dl className="grid md:grid-cols-3 gap-3 text-sm">
                  <D k="消费级 24GB" v={m.memory.ref_hw_24gb ?? '未评估'} />
                  <D k="单卡 80GB" v={m.memory.ref_hw_80gb ?? '未评估'} />
                  <D k="8×80GB 节点" v={m.memory.ref_hw_8x80gb ?? '未评估'} />
                </dl>
                {m.memory.kv_note && <p className="text-sm"><span className="text-muted">KV Cache：</span>{m.memory.kv_note}{m.memory.kv_per_token_kib && <span className="num"> ≈ {m.memory.kv_per_token_kib} KiB/token</span>}</p>}
                <p className="text-xs text-community">⚠ 能加载 ≠ 能在满上下文 / 高并发下舒服跑。标「估」的数字来自 <Link to="/calculator" className="link">计算器</Link> 公式或社区量化文件大小。</p>
                <Md md={m.sheet?.memory_md} />
                <Link to="/calculator" className="link text-sm">用计算器按你的上下文与并发估算 →</Link>
              </div>
            ) : <div className="space-y-3"><p className="text-sm text-muted">闭源模型，无自建选项，不提供显存表。</p><Md md={m.sheet?.memory_md} /></div>}
          </Sec>
          <Sec id="s3" n={3} title="能力画像" open>
            <div className="grid gap-4 md:grid-cols-[260px_1fr]">
              <div className="h-[240px]"><CapabilityRadar data={radarFor(m)} color={isOpenWeights(m) ? 'var(--open)' : 'var(--closed)'} /></div>
              <div className="space-y-2 text-sm">
                {(Object.keys(CAP_LABEL) as CapabilityKey[]).filter((k) => m.capability_notes[k]).map((k) => <p key={k}><span className="inline-block w-16 text-muted">{CAP_LABEL[k]}</span>{m.capability_notes[k]}</p>)}
                {Object.keys(m.capability_notes).length === 0 && <p className="text-muted">完善中</p>}
                <div className="rounded-lg bg-surface-2 p-3 mt-2"><div className="text-[11px] uppercase tracking-wide text-muted mb-1">逻辑能力</div><p className="leading-relaxed">{m.copy.logic_ability}</p></div>
              </div>
            </div>
          </Sec>
          <Sec id="s4" n={4} title="训练与推理行为">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <D k="默认思考" v={{ none: '无思考模式', optional: '可开关', 'default-on': '默认开启' }[m.reasoning_mode]} />
              <D k="工具调用" v={m.modalities.includes('tools') ? '支持' : '未知'} />
              <D k="计算机使用" v={m.modalities.includes('computer-use') ? '支持' : '—'} />
              <D k="最大输出" v={m.context.max_output ? `${Math.round(m.context.max_output / 1024)}K` : '未披露'} />
            </dl>
            <Md md={m.sheet?.training_md} />
          </Sec>
          <Sec id="s5" n={5} title="亮点与坑" open>
            <div className="grid gap-4 md:grid-cols-2">
              <List title="亮点" items={m.copy.highlights} tone="up" />
              <List title="坑" items={m.copy.pitfalls} tone="down" />
            </div>
            {(m.copy.best_for.length > 0 || m.copy.not_for.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div><span className="text-muted">适合：</span>{m.copy.best_for.join(' · ') || '—'}</div>
                <div><span className="text-muted">不适合：</span>{m.copy.not_for.join(' · ') || '—'}</div>
              </div>
            )}
          </Sec>
          <Sec id="s6" n={6} title="生态与部署">
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
              <D k="推理引擎" v={m.ecosystem?.engines?.length ? m.ecosystem.engines.join(' / ') : (isOpenWeights(m) ? '完善中' : '官方 API')} />
              <D k="微调" v={m.ecosystem?.finetune ?? (isOpenWeights(m) ? '完善中' : '不支持')} />
              <D k="中文文档" v={m.ecosystem?.zh_docs ?? '完善中'} />
            </dl>
            <div className="flex flex-wrap gap-2 text-sm mb-3">
              {Object.entries(m.links).filter(([, u]) => u).map(([k, u]) => <a key={k} href={u} target="_blank" rel="noreferrer" className="link">{({ official: '官方', hf: 'Hugging Face', github: 'GitHub', paper: '论文 / 报告', pricing: '定价' } as Record<string, string>)[k] ?? k} ↗</a>)}
            </div>
            <Md md={m.sheet?.ecosystem_md} />
          </Sec>
          <Sec id="s7" n={7} title="证据与榜单明细" open>
            {scores.length === 0 ? <p className="text-sm text-muted">暂无带来源的分数。</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead className="text-[11px] uppercase tracking-wide text-muted"><tr className="border-b border-border"><th className="text-left py-1.5 pr-3">基准</th><th className="text-right py-1.5 pr-3">分数</th><th className="text-left py-1.5 pr-3">来源</th><th className="text-left py-1.5 pr-3">日期</th><th className="text-left py-1.5">证据</th></tr></thead>
                  <tbody>
                    {scores.map((s) => { const b = getBenchmark(s.key); return (
                      <tr key={s.key} className="border-b border-border/60">
                        <td className="py-1.5 pr-3">{b?.name ?? s.key}{b?.name_zh && <span className="text-xs text-muted ml-1">{b.name_zh}</span>}</td>
                        <td className="py-1.5 pr-3 num text-right">{s.value}{s.unit === 'percent' ? '%' : ''}</td>
                        <td className="py-1.5 pr-3 text-xs">{s.source_url ? <a className="link" href={s.source_url} target="_blank" rel="noreferrer">{s.source}</a> : s.source}</td>
                        <td className="py-1.5 pr-3 num text-xs text-muted">{s.as_of}</td>
                        <td className="py-1.5"><EvidenceTag level={s.evidence} /></td>
                      </tr>) })}
                  </tbody>
                </table>
              </div>
            )}
          </Sec>
          <Sec id="s8" n={8} title="版本与家族">
            {family.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{family.map((x) => <Link key={x.id} to={`/models/${x.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-sm hover:bg-surface-2">{x.name}{x.status !== 'current' && <Badge tone="warn">{x.status}</Badge>}</Link>)}</div>}
            <Md md={m.sheet?.versions_md} />
          </Sec>
          <p className="text-xs text-muted">更新 <span className="num">{m.updated_at}</span> · 排名供选型参考，基准会饱和、会泄漏、会过时。</p>
        </div>
      </div>
    </div>
  )
}

function Sec({ id, n, title, open = false, children }: { id: string; n: number; title: string; open?: boolean; children: React.ReactNode }) {
  const [o, setO] = useState(open)
  return (
    <section id={id} className="card scroll-mt-20">
      <button type="button" onClick={() => setO(!o)} aria-expanded={o} className="flex w-full items-center justify-between px-5 py-3 text-left">
        <span className="font-semibold"><span className="num text-muted mr-2">{n}.</span>{title}</span>
        <span className={cx('text-muted transition', o && 'rotate-180')}>▾</span>
      </button>
      {o && <div className="border-t border-border px-5 py-4">{children}</div>}
    </section>
  )
}
function D({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-[11px] text-muted">{k}</dt><dd className={cx('font-medium', typeof v === 'number' && 'num', v === '未披露' && 'text-muted font-normal')}>{v}</dd></div>
}
function List({ title, items, tone }: { title: string; items: string[]; tone: 'up' | 'down' }) {
  return (
    <div>
      <div className={cx('text-[11px] uppercase tracking-wide mb-2', tone === 'up' ? 'text-up' : 'text-down')}>{title}</div>
      {items.length === 0 ? <p className="text-sm text-muted">完善中</p> : <ol className="space-y-1.5 text-sm">{items.map((x, i) => <li key={i} className="flex gap-2"><span className="num text-muted">{i + 1}.</span><span>{x}</span></li>)}</ol>}
    </div>
  )
}
function Md({ md }: { md?: string }) {
  if (!md) return <p className="text-sm text-muted">完善中</p>
  return <div className="md text-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown></div>
}
