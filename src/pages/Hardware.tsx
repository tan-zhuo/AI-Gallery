import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { models } from '@/lib/catalog'
import { GPUS, TIER_LABEL, fmtTok, fmtCtx } from '@/lib/perf'
import { CONTEXTS, QUANTS, decodeEff, runModel, summarize, quantLabel, type ClusterSpec } from '@/lib/cluster'
import { QUANT_LABEL } from '@/lib/vram'
import { formatGB, tParams, cx } from '@/lib/format'
import { ModelName } from '@/components/ui/ModelName'
import { Badge } from '@/components/ui/Badge'
import { Empty, Section } from '@/components/ui/Misc'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useColResize } from '@/components/ui/useColResize'
import { useT } from '@/i18n'
import { useSeo } from '@/hooks/useSeo'

const fmtCny = (n: number) => (n >= 1e4 ? `¥${(n / 1e4).toFixed(n >= 1e6 ? 0 : 1)}万` : `¥${Math.round(n).toLocaleString()}`)
const fmtCost = (n?: number) => (n == null || !isFinite(n) ? '—' : n >= 100 ? `¥${Math.round(n)}` : n >= 1 ? `¥${n.toFixed(2)}` : `¥${n.toFixed(3)}`)

export default function Hardware() {
  const { t } = useT()
  useSeo({ title: t('我的显卡能跑哪些大模型'), description: t('选择显卡、每机卡数与机器台数，设置精度、上下文、并发与电价，计算能运行的开源模型、吞吐与自建每百万 token 成本。'), path: '/hardware' })
  const [spec, setSpec] = useLocalStorage<Omit<ClusterSpec, 'gpu'> & { gpuId: string }>('mb_cluster', {
    gpuId: 'rtx4090', perNode: 1, nodes: 1, precision: 'auto', context: 8192, batch: 1, kwhPrice: 0.8, hoursPerDay: 24, deprecationMonths: 36, fxUsdCny: 7.2,
  })
  const [onlyFit, setOnlyFit] = useState(true)
  const [old, setOld] = useState(false)
  const gpu = GPUS.find((g) => g.id === spec.gpuId) ?? GPUS[0]
  const full: ClusterSpec = { ...spec, gpu }
  const sum = useMemo(() => summarize(full), [full])
  const { eff, note } = decodeEff(full)
  const runs = useMemo(() => {
    const ms = models.filter((m) => m.weights_available && (old || m.status !== 'superseded'))
    return ms.map((m) => runModel(m, full, sum)).filter((r) => !onlyFit || r.fits).sort((a, b) => (b.aggregate ?? -1) - (a.aggregate ?? -1))
  }, [full, sum, onlyFit, old])
  const set = (patch: Partial<typeof spec>) => setSpec((s) => ({ ...s, ...patch }))
  const perNodeOpts = [1, 2, 4, 8].filter((c) => c <= gpu.max_count)
  const COLS = ['model', 'params', 'quant', 'mem', 'single', 'agg', 'ctx', 'cost', 'api']
  const { ref, thProps, Handle, tableStyle } = useColResize('hardware', COLS)

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">{t('我的显卡能跑谁')}</h1><p className="text-xs text-muted mt-1">{t('配置集群规格、精度、上下文与成本参数，估算能运行的开源模型、吞吐与自建每百万 token 成本。所有数字为估算，假设见底部。')}</p></div>

      {/* 配置面板 */}
      <div className="card p-4 md:p-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="eyebrow">{t('集群规格')}</div>
          <L label={t('显卡型号')}>
            <select value={gpu.id} onChange={(e) => set({ gpuId: e.target.value, perNode: 1 })} className="ctl ctl-block">
              {(['consumer', 'workstation', 'datacenter', 'mac'] as const).map((tier) => <optgroup key={tier} label={t(TIER_LABEL[tier])}>{GPUS.filter((g) => g.tier === tier).map((g) => <option key={g.id} value={g.id}>{g.name} · {g.vram_gb}GB · {g.bandwidth_gbs} GB/s · {g.tdp_w}W</option>)}</optgroup>)}
            </select>
          </L>
          <div className="grid grid-cols-2 gap-3">
            <L label={t('每机卡数')}><div className="seg">{perNodeOpts.map((c) => <button key={c} type="button" aria-pressed={spec.perNode === c} onClick={() => set({ perNode: c })} className="num flex-1">{c}</button>)}</div></L>
            <L label={t('机器台数')}><input type="number" min={1} max={64} value={spec.nodes} onChange={(e) => set({ nodes: Math.max(1, Math.min(64, +e.target.value || 1)) })} className="ctl ctl-block num" /></L>
          </div>
          <div className="text-xs text-muted">{t('互联：{note} · 带宽效率 {eff}', { note: t(note), eff: eff.toFixed(2) })}{gpu.note && <> · {t(gpu.note)}</>}</div>
        </div>
        <div className="space-y-3">
          <div className="eyebrow">{t('推理配置')}</div>
          <L label={t('精度')}>
            <div className="grid grid-cols-7 gap-1">
              <button type="button" aria-pressed={spec.precision === 'auto'} onClick={() => set({ precision: 'auto' })} className={cx('ctl ctl-sm justify-center text-xs', spec.precision === 'auto' && 'bg-text text-bg border-text')}>{t('自动')}</button>
              {QUANTS.map((q) => <button key={q} type="button" aria-pressed={spec.precision === q} onClick={() => set({ precision: q })} className={cx('ctl ctl-sm justify-center num text-xs px-1', spec.precision === q && 'bg-text text-bg border-text')}>{QUANT_LABEL[q].split('_')[0]}</button>)}
            </div>
          </L>
          <L label={t('上下文长度')}>
            <select value={spec.context} onChange={(e) => set({ context: +e.target.value })} className="ctl ctl-block num">
              {CONTEXTS.map((c) => <option key={c} value={c}>{fmtCtx(c)} ({c.toLocaleString()} tokens)</option>)}
            </select>
          </L>
          <L label={t('并发请求数（batch）· {n}', { n: spec.batch })}><input type="range" min={1} max={128} value={spec.batch} onChange={(e) => set({ batch: +e.target.value })} className="w-full" /></L>
        </div>
        <div className="space-y-3">
          <div className="eyebrow">{t('成本参数')}</div>
          <div className="grid grid-cols-2 gap-3">
            <L label={t('电价 ¥/kWh')}><input type="number" step={0.1} min={0} value={spec.kwhPrice} onChange={(e) => set({ kwhPrice: +e.target.value })} className="ctl ctl-block num" /></L>
            <L label={t('每日运行小时')}><input type="number" min={1} max={24} value={spec.hoursPerDay} onChange={(e) => set({ hoursPerDay: Math.max(1, Math.min(24, +e.target.value || 24)) })} className="ctl ctl-block num" /></L>
            <L label={t('折旧期（月）')}><input type="number" min={6} max={120} value={spec.deprecationMonths} onChange={(e) => set({ deprecationMonths: Math.max(6, +e.target.value || 36) })} className="ctl ctl-block num" /></L>
            <L label={t('汇率 USD→CNY')}><input type="number" step={0.1} value={spec.fxUsdCny} onChange={(e) => set({ fxUsdCny: +e.target.value || 7.2 })} className="ctl ctl-block num" /></L>
          </div>
          <div className="text-xs text-muted">{t('整机价 = 卡价 × 卡数 + 每机底价 {base}（机箱 / CPU / 内存 / 网卡）；功耗 = TDP × 卡数 + 每机底耗 {w}W', { base: fmtCny(gpu.node_base_cny), w: gpu.node_base_w })}</div>
        </div>
      </div>

      {/* 汇总 */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Stat label={t('总卡数')} v={sum.gpus} sub={`${spec.nodes} × ${spec.perNode}`} />
        <Stat label={t('总显存')} v={`${sum.vram.toLocaleString()} GB`} />
        <Stat label={t('总带宽')} v={`${(sum.bandwidth / 1000).toFixed(1)} TB/s`} />
        <Stat label={t('FP16 算力')} v={`${sum.tflops.toLocaleString()} T`} />
        <Stat label={t('整机价格')} v={fmtCny(sum.capexCny)} sub={sum.cloudUsdH ? t('云租用 ≈${h}/h', { h: sum.cloudUsdH.toFixed(1) }) : undefined} />
        <Stat label={t('满载功耗')} v={`${sum.powerKw.toFixed(1)} kW`} sub={t('{kwh} kWh/天', { kwh: (sum.powerKw * spec.hoursPerDay).toFixed(0) })} />
        <Stat label={t('月电费')} v={fmtCny(sum.monthlyElecCny)} />
        <Stat label={t('月总成本')} v={fmtCny(sum.monthlyTotalCny)} sub={t('含折旧 {m} 个月', { m: spec.deprecationMonths })} />
      </div>

      {/* 结果表 */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="check"><input type="checkbox" checked={onlyFit} onChange={(e) => setOnlyFit(e.target.checked)} />{t('只看能装下的')}</label>
        <label className="check"><input type="checkbox" checked={old} onChange={(e) => setOld(e.target.checked)} />{t('含旧代')}</label>
        <span className="ml-auto text-xs text-muted num">{t('{n} 个模型', { n: runs.length })}</span>
      </div>
      {runs.length === 0 ? <Empty text={t('这个配置装不下任何收录的开源模型，试试加卡、降精度或降上下文。')} /> : (
        <div className="card overflow-x-auto">
          <table ref={ref} style={tableStyle} className="tbl w-full text-sm min-w-[980px]">
            <thead className="text-[11px] uppercase tracking-wide text-muted"><tr className="border-b border-border">
              <th {...thProps('model')} className="px-3 py-2 text-left">{t('模型')}<Handle k="model" /></th>
              <th {...thProps('params')} className="px-2 py-2 text-left">{t('参数')}<Handle k="params" /></th>
              <th {...thProps('quant')} className="px-2 py-2 text-left">{t('精度')}<Handle k="quant" /></th>
              <th {...thProps('mem')} className="px-2 py-2 text-right" title={t('权重 + KV + 开销 / 总显存')}>{t('占用 / 显存')}<Handle k="mem" /></th>
              <th {...thProps('single')} className="px-2 py-2 text-right">{t('单流 tok/s')}<Handle k="single" /></th>
              <th {...thProps('agg')} className="px-2 py-2 text-right" title={t('并发 {b} 下的聚合吞吐，受算力上限约束', { b: spec.batch })}>{t('聚合 tok/s')}<Handle k="agg" /></th>
              <th {...thProps('ctx')} className="px-2 py-2 text-right">{t('最大上下文')}<Handle k="ctx" /></th>
              <th {...thProps('cost')} className="px-2 py-2 text-right" title={t('电费 + 折旧 ÷ 聚合吞吐；括号内仅电费')}>{t('自建 ¥/1M tok')}<Handle k="cost" /></th>
              <th {...thProps('api')} className="px-2 py-2 text-right" title={t('该模型官方 / 常见托管 API 输出价换算')}>{t('API ¥/1M')}</th>
            </tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.m.id} className={cx('border-b border-border/60', !r.fits && 'opacity-60')}>
                  <td className="px-3 py-2 min-w-[220px]"><div className="flex items-center gap-2"><ModelName m={r.m} />{r.m.status === 'superseded' && <Badge tone="warn">{t('旧代')}</Badge>}</div></td>
                  <td className="px-2 py-2 text-xs num whitespace-nowrap">{tParams(t, r.m.architecture.total_params, r.m.architecture.active_params)}</td>
                  <td className="px-2 py-2 num">{quantLabel(r.quant)}{r.estimatedWeight && <span className="text-[10px] text-community ml-1">{t('估')}</span>}</td>
                  <td className="px-2 py-2 num text-right whitespace-nowrap">
                    {r.totalGb != null ? <>{formatGB(r.totalGb)} <span className="text-muted">/ {sum.vram} GB</span></> : '—'}
                    {!r.fits && <div className="text-[10px] text-down">{r.reason}{r.shortfallGb ? ` · ${t('差 {g}', { g: formatGB(r.shortfallGb) })}` : ''}</div>}
                    {r.fits && !r.kvModeled && <div className="text-[10px] text-community">{t('KV 未建模')}</div>}
                  </td>
                  <td className="px-2 py-2 num text-right">{fmtTok(r.single)}</td>
                  <td className="px-2 py-2 num text-right font-semibold">{fmtTok(r.aggregate)}{r.aggregate != null && r.computeCap != null && r.aggregate >= r.computeCap * 0.999 && <span className="ml-1 text-[9px] text-muted align-top" title={t('已达算力上限')}>cap</span>}</td>
                  <td className="px-2 py-2 num text-right">{r.fits ? (r.kvModeled ? fmtCtx(r.maxContext) : <span className="text-community">—</span>) : '—'}</td>
                  <td className="px-2 py-2 num text-right whitespace-nowrap">{fmtCost(r.cnyPerMTok)}{r.fits && <span className="text-[10px] text-muted ml-1">({fmtCost(r.cnyPerMTokElec)})</span>}</td>
                  <td className={cx('px-2 py-2 num text-right whitespace-nowrap', r.apiCnyPerMTok != null && r.apiCnyPerMTok > 0 && r.cnyPerMTok != null && (r.apiCnyPerMTok > r.cnyPerMTok ? 'text-up' : 'text-down'))}>{r.apiCnyPerMTok == null ? '—' : r.apiCnyPerMTok === 0 ? <span className="text-muted">{t('免费层')}</span> : fmtCost(r.apiCnyPerMTok)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Section title={t('估算假设')} sub={t('与模型详情页「硬件与吞吐」同源；误差 ±30%，多机再打折。')}>
        <pre className="card p-4 text-xs overflow-x-auto num whitespace-pre-wrap">{t(`占用        = 权重(精度) + KV(上下文 × 并发) + 1.2 GB × 卡数
单流 tok/s  = 总带宽 × eff ÷ (激活参数 × 每参数字节 + KV/token × 上下文)
聚合 tok/s  = min( batch × 总带宽 × eff ÷ (权重字节 + batch × KV字节),  算力上限 )
算力上限    = FP16 TFLOPS × 卡数 × 0.45 ÷ (2 × 激活参数)
eff         = 单卡 0.65 · NVLink 0.55 · PCIe 0.45 · 统一内存 0.5；跨机 × 0.8
¥/1M token  = (功耗 kW × 电价 + 整机价 ÷ 折旧月 ÷ 30 ÷ 每日小时) ÷ (聚合 tok/s × 3600 ÷ 1e6)
API ¥/1M    = 官方或常见托管输出价 × 汇率（仅输出价，不含输入与缓存折扣）
精度「自动」 = 能装下的最高精度（BF16 > FP8 > Q8 > Q6 > Q5 > Q4）；MoE 权重全部驻留显存
KV 未建模   = 缺层数 / KV 头数的模型只按权重判断，最大上下文不给出`)}</pre>
      </Section>
      <p className="text-xs text-muted">{t('显卡表在')} <code>data/hardware.json</code>{t('，规格为公开数据，价格 / TDP / 底价为参考值。')}<Link to="/calculator" className="link">{t('按精确上下文与并发算显存 →')}</Link></p>
    </div>
  )
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-xs text-muted">{label}</div>{children}</label>
}
function Stat({ label, v, sub }: { label: string; v: React.ReactNode; sub?: string }) {
  return <div className="card p-3 min-w-0"><div className="eyebrow truncate">{label}</div><div className="num text-lg font-semibold truncate">{v}</div>{sub && <div className="text-[11px] text-muted truncate">{sub}</div>}</div>
}
