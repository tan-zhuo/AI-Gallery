import { useMemo, useState } from 'react'
import { models } from '@/lib/catalog'
import { estimateVram, QUANT_LABEL, BYTES_PER_PARAM, type CalcQuant } from '@/lib/vram'
import { formatGB, paramsB, cx } from '@/lib/format'
import { Section, Stat } from '@/components/ui/Misc'
import { Link } from 'react-router-dom'
import { GPUS, estimatePerf, fmtTok } from '@/lib/perf'
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/i18n'


const openModels = models.filter((m) => m.weights_available && (m.architecture.total_params_b ?? paramsB(m.architecture.total_params)))
const priced = models.filter((m) => m.pricing?.input_per_m != null && m.pricing.output_per_m != null)

export default function Calculator() {
  const { t } = useT()
  useSeo({ title: t('显存与 API 成本计算器'), description: t('估算开源大模型在不同量化、上下文与并发下的显存占用与 tok/s，以及闭源 API 的日 / 月费用。'), path: '/calculator' })
  const [tab, setTab] = useState<'vram' | 'api'>('vram')
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">{t('计算器')}</h1><p className="text-xs text-muted mt-1">{t('全部在浏览器内计算，纯函数，假设写在底部。')}</p></div>
      <div className="seg" role="tablist">
        {([['vram', '显存估算'], ['api', 'API 成本']] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(l)}</button>)}
      </div>
      {tab === 'vram' ? <Vram /> : <Api />}
    </div>
  )
}

function Vram() {
  const { t } = useT()
  const [id, setId] = useState(openModels.find((m) => m.id === 'qwen3-32b')?.id ?? openModels[0].id)
  const [quant, setQuant] = useState<CalcQuant>('q4')
  const [ctx, setCtx] = useState(32768)
  const [batch, setBatch] = useState(1)
  const m = openModels.find((x) => x.id === id)!
  const r = useMemo(() => estimateVram(m, quant, ctx, batch), [m, quant, ctx, batch])
  const [gpuId, setGpuId] = useState('rtx4090')
  const [gpuN, setGpuN] = useState(1)
  const gpu = GPUS.find((g) => g.id === gpuId)!
  const perf = useMemo(() => estimatePerf(m, gpu, gpuN, quant, ctx), [m, gpu, gpuN, quant, ctx])
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="card p-4 space-y-4 text-sm">
        <L label={t('模型')}>
          <select value={id} onChange={(e) => setId(e.target.value)} className="ctl ctl-block">
            {openModels.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.architecture.total_params}{x.architecture.active_params ? ` / ${x.architecture.active_params}` : ''}</option>)}
          </select>
        </L>
        <L label={t('精度')}>
          <div className="seg seg-sm flex-wrap h-auto">{(Object.keys(QUANT_LABEL) as CalcQuant[]).map((q) => <button key={q} type="button" aria-pressed={quant === q} onClick={() => setQuant(q)} className="h-7">{QUANT_LABEL[q]}</button>)}</div>
        </L>
        <L label={t('上下文长度 · {n} token', { n: ctx.toLocaleString() })}>
          <input type="range" min={2048} max={Math.min(m.context.max_tokens ?? 262144, 1048576)} step={2048} value={ctx} onChange={(e) => setCtx(+e.target.value)} className="w-full" />
          <div className="seg seg-sm mt-1">{[8192, 32768, 131072, 262144].filter((v) => v <= (m.context.max_tokens ?? 262144)).map((v) => <button key={v} type="button" aria-pressed={ctx === v} onClick={() => setCtx(v)} className="num">{v / 1024}K</button>)}</div>
        </L>
        <L label={t('并发 batch · {n}', { n: batch })}><input type="range" min={1} max={64} value={batch} onChange={(e) => setBatch(+e.target.value)} className="w-full" /></L>
        <Link to={`/models/${m.id}`} className="link text-xs">{t('查看 {name} 说明书 →', { name: m.name })}</Link>
      </div>
      <div className="space-y-4">
        <div className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label={t('权重')} value={formatGB(r.weight_gb)} sub={QUANT_LABEL[quant]} />
          <Stat label="KV Cache" value={r.kv_modeled ? formatGB(r.kv_gb) : t('未建模')} sub={r.kv_modeled ? `${ctx / 1024}K × ${batch}` : t('缺层数 / KV 头')} />
          <Stat label={t('合计（估）')} value={formatGB(r.total_gb)} sub={r.kv_modeled ? '' : t('仅权重')} />
          <Stat label={t('建议')} value={<span className="text-base">{r.suggestion}</span>} />
        </div>
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block flex-1 min-w-[200px]"><div className="mb-1 text-xs text-muted">{t('在这张卡上跑（单流吞吐）')}</div>
              <select value={gpuId} onChange={(e) => { setGpuId(e.target.value); setGpuN(1) }} className="ctl ctl-block">{GPUS.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.bandwidth_gbs} GB/s</option>)}</select></label>
            <div className="seg">{[1, 2, 4, 8].filter((c) => c <= gpu.max_count).map((c) => <button key={c} type="button" aria-pressed={gpuN === c} onClick={() => setGpuN(c)} className="num">{c}×</button>)}</div>
          </div>
          {perf && (
            <div className="grid grid-cols-3 gap-4">
              <Stat label={perf.fits ? t('能装下') : t('装不下')} value={<span className={perf.fits ? 'text-open' : 'text-down'}>{formatGB(perf.total_gb)} / {perf.vram_gb} GB</span>} />
              <Stat label={t('解码')} value={perf.fits ? `${fmtTok(perf.decode_tok_s)} tok/s` : '—'} sub="batch=1" />
              <Stat label={t('预填充')} value={perf.fits ? `${fmtTok(perf.prefill_tok_s)} tok/s` : '—'} />
            </div>
          )}
        </div>
        {!r.kv_modeled && <div className="rounded-lg border border-community/40 bg-community/10 p-3 text-xs">{t('⚠ 该模型缺少层数或 KV 头数，KV Cache 未建模。实际长上下文占用会显著更高。')}</div>}
        <div className="card p-4 text-xs space-y-1.5">
          <div className="font-medium text-sm">{t('本次假设')}</div>
          <ul className="list-disc pl-4 space-y-1 text-muted">{r.assumptions.map((a, i) => <li key={i} className="num">{a}</li>)}</ul>
          {m.memory.kv_note && <p className="text-muted pt-1">{t('模型页备注：')}{m.memory.kv_note}</p>}
        </div>
        <Section title={t('公式与假设')} sub={t('MVP 简化公式；能加载 ≠ 能在满上下文 / 高并发下舒服跑。')}>
          <pre className="card p-4 text-xs overflow-x-auto num">{t(`weight_mem ≈ params_b × bytes_per_param × 1.08
kv_mem     ≈ layers × kv_heads × head_dim × 2 × seq × batch × dtype_bytes × 1.2

bytes_per_param: {bpp}
· 若数据表有官方 / 社区 GGUF 文件大小，优先用该值 × 1.04
· MoE 权重全部驻留显存（不做专家 offload）
· KV dtype：BF16/Q 系列按 2 B，FP8 按 1 B（FP8 KV）
· MLA 模型（DeepSeek / Kimi）按 kv_heads=1、head_dim=288 等效换算 576 维潜向量
· 混合线性注意力（Qwen3-Next）只对全注意力层计 KV
· 滑窗模型（Gemma 3 / gpt-oss）只对全局层计 KV，滑窗层视为常数
· 不含 CUDA context（~0.5–1 GB）、激活、投机解码 draft 模型`, { bpp: Object.entries(BYTES_PER_PARAM).map(([k, v]) => `${QUANT_LABEL[k as CalcQuant]}=${v}`).join('  ') })}</pre>
        </Section>
      </div>
    </div>
  )
}

function Api() {
  const { t } = useT()
  const [id, setId] = useState('claude-sonnet-4-5')
  const [req, setReq] = useState(10000)
  const [inTok, setInTok] = useState(2000)
  const [outTok, setOutTok] = useState(500)
  const m = priced.find((x) => x.id === id) ?? priced[0]
  const cost = (x: typeof m) => (req * (inTok * x.pricing!.input_per_m! + outTok * x.pricing!.output_per_m!)) / 1e6
  const daily = cost(m)
  const near = useMemo(() => priced.filter((x) => x.id !== m.id).map((x) => ({ x, c: cost(x) })).sort((a, b) => Math.abs(Math.log(a.c / daily)) - Math.abs(Math.log(b.c / daily))).slice(0, 3), [m, req, inTok, outTok]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="card p-4 space-y-4 text-sm">
        <L label={t('模型（有公开价）')}>
          <select value={m.id} onChange={(e) => setId(e.target.value)} className="ctl ctl-block">
            {priced.map((x) => <option key={x.id} value={x.id}>{x.name} · ${x.pricing!.input_per_m} / ${x.pricing!.output_per_m}</option>)}
          </select>
        </L>
        <L label={t('日请求量')}><input type="number" value={req} onChange={(e) => setReq(+e.target.value)} className="ctl ctl-block" /></L>
        <L label={t('平均输入 token')}><input type="number" value={inTok} onChange={(e) => setInTok(+e.target.value)} className="ctl ctl-block" /></L>
        <L label={t('平均输出 token')}><input type="number" value={outTok} onChange={(e) => setOutTok(+e.target.value)} className="ctl ctl-block" /></L>
      </div>
      <div className="space-y-4">
        <div className="card p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label={t('日费')} value={`$${daily.toFixed(2)}`} />
          <Stat label={t('月费 (30 天)')} value={`$${(daily * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Stat label={t('单次')} value={`$${(daily / req).toFixed(4)}`} sub={`${inTok} in / ${outTok} out`} />
        </div>
        <div className="card overflow-hidden">
          <div className="px-4 py-2 text-xs text-muted border-b border-border">{t('相近成本的模型对照')}</div>
          <table className="w-full text-sm">
            <tbody>
              {near.map(({ x, c }) => (
                <tr key={x.id} className="border-b border-border/60">
                  <td className="px-4 py-2"><Link to={`/models/${x.id}`} className="hover:underline font-medium">{x.name}</Link><span className="text-xs text-muted ml-2">{x.vendor}</span></td>
                  <td className="px-4 py-2 text-right num">${c.toFixed(2)} / {t('日')}</td>
                  <td className={cx('px-4 py-2 text-right num text-xs', c < daily ? 'text-up' : 'text-down')}>{c < daily ? '−' : '+'}{Math.abs((c / daily - 1) * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">{t('价格 = 每百万 token 官方价或第三方托管常见价（标注于模型页），不含缓存折扣、批处理折扣、长上下文加价与推理 token。数据日期见模型页。')}</p>
      </div>
    </div>
  )
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-xs text-muted">{label}</div>{children}</label>
}
