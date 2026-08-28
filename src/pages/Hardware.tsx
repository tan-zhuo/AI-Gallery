import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { models } from '@/lib/catalog'
import { GPUS, TIER_LABEL, modelsForGpu, fmtTok, fmtCtx } from '@/lib/perf'
import { QUANT_LABEL } from '@/lib/vram'
import { formatGB, tParams } from '@/lib/format'
import { ModelName } from '@/components/ui/ModelName'
import { Badge } from '@/components/ui/Badge'
import { Empty, Section } from '@/components/ui/Misc'
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/i18n'


export default function Hardware() {
  const { t } = useT()
  useSeo({ title: t('我的显卡能跑哪些大模型'), description: t('选择 RTX 4090 / 5090 / A100 / H100 / Mac 等显卡与数量，列出能本地运行的开源大模型、最佳量化与预估 tok/s。'), path: '/hardware' })
  const [gpuId, setGpuId] = useState('rtx4090')
  const [count, setCount] = useState(1)
  const [ctx, setCtx] = useState(8192)
  const [old, setOld] = useState(false)
  const gpu = GPUS.find((g) => g.id === gpuId)!
  const rows = useMemo(() => {
    const ms = models.filter((m) => old || m.status !== 'superseded')
    return modelsForGpu(ms, gpu, count, ctx).sort((a, b) => (b.est.decode_tok_s ?? 0) - (a.est.decode_tok_s ?? 0))
  }, [gpu, count, ctx, old])
  const counts = [1, 2, 4, 8].filter((c) => c <= gpu.max_count)
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">{t('我的显卡能跑谁')}</h1><p className="text-xs text-muted mt-1">{t('选显卡与数量，列出能装下的开源模型、最佳量化与预估单流吞吐。所有数字为估算，见底部假设。')}</p></div>
      <div className="card p-4 grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-end">
        <label className="block"><div className="mb-1 text-xs text-muted">{t('显卡')}</div>
          <select value={gpuId} onChange={(e) => { setGpuId(e.target.value); setCount(1) }} className="ctl ctl-block">
            {(['consumer', 'workstation', 'datacenter', 'mac'] as const).map((tier) => <optgroup key={tier} label={t(TIER_LABEL[tier])}>{GPUS.filter((g) => g.tier === tier).map((g) => <option key={g.id} value={g.id}>{g.name} · {g.bandwidth_gbs} GB/s · {g.price_hint}</option>)}</optgroup>)}
          </select></label>
        <label className="block"><div className="mb-1 text-xs text-muted">{t('数量')}</div>
          <div className="seg">{counts.map((c) => <button key={c} type="button" aria-pressed={count === c} onClick={() => setCount(c)} className="num">{c}</button>)}</div></label>
        <label className="block"><div className="mb-1 text-xs text-muted">{t('上下文')}</div>
          <div className="seg">{[8192, 32768, 131072].map((c) => <button key={c} type="button" aria-pressed={ctx === c} onClick={() => setCtx(c)} className="num">{c / 1024}K</button>)}</div></label>
        <label className="check"><input type="checkbox" checked={old} onChange={(e) => setOld(e.target.checked)} />{t('含旧代')}</label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="card p-3"><div className="eyebrow">{t('总显存')}</div><div className="num text-xl font-semibold">{gpu.vram_gb * count} GB</div></div>
        <div className="card p-3"><div className="eyebrow">{t('总带宽')}</div><div className="num text-xl font-semibold">{(gpu.bandwidth_gbs * count).toLocaleString()} GB/s</div></div>
        <div className="card p-3"><div className="eyebrow">{t('FP16 算力')}</div><div className="num text-xl font-semibold">{gpu.fp16_tflops * count} TFLOPS</div></div>
        <div className="card p-3"><div className="eyebrow">{t('可跑模型')}</div><div className="num text-xl font-semibold">{rows.length}</div></div>
      </div>
      {gpu.note && <p className="text-xs text-muted">{gpu.note}</p>}
      {rows.length === 0 ? <Empty text={t('这个配置装不下任何收录的开源模型，试试加卡或降上下文。')} /> : (
        <div className="card overflow-x-auto">
          <table className="tbl w-full text-sm min-w-[760px]">
            <thead className="text-[11px] uppercase tracking-wide text-muted"><tr className="border-b border-border">
              <th className="px-3 py-2 text-left">{t('模型')}</th><th className="px-2 py-2 text-left">{t('参数')}</th><th className="px-2 py-2 text-left">{t('量化')}</th><th className="px-2 py-2 text-right">{t('占用')}</th><th className="px-2 py-2 text-right">{t('解码 tok/s')}</th><th className="px-2 py-2 text-right">{t('预填充 tok/s')}</th><th className="px-2 py-2 text-right">{t('最大上下文')}</th>
            </tr></thead>
            <tbody>
              {rows.map(({ m, est }) => (
                <tr key={m.id} className="border-b border-border/60">
                  <td className="px-3 py-2 min-w-[220px]"><ModelName m={m} />{m.status === 'superseded' && <Badge tone="warn" className="mt-1">{t('旧代')}</Badge>}</td>
                  <td className="px-2 py-2 text-xs num">{tParams(t, m.architecture.total_params, m.architecture.active_params)}</td>
                  <td className="px-2 py-2 num">{QUANT_LABEL[est.quant]}{est.estimated_weight && <span className="text-[10px] text-community ml-1">{t('估')}</span>}</td>
                  <td className="px-2 py-2 num text-right">{formatGB(est.total_gb)}</td>
                  <td className="px-2 py-2 num text-right font-semibold">{fmtTok(est.decode_tok_s)}</td>
                  <td className="px-2 py-2 num text-right text-muted">{fmtTok(est.prefill_tok_s)}</td>
                  <td className="px-2 py-2 num text-right">{est.kv_modeled ? fmtCtx(est.max_context) : <span className="text-community">{t('未建模')}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Section title={t('估算假设')} sub={t('与模型详情页「硬件与吞吐」一致，可在方法论页查看。')}>
        <pre className="card p-4 text-xs overflow-x-auto num">{t(`占用     = 权重(量化) + KV(上下文) + 1.2 GB × 卡数
解码 tok/s = 带宽 × 卡数 × eff ÷ (激活参数 × 每参数字节 + KV/token × 上下文)
            eff：单卡 0.65 · 多卡张量并行 0.55 · Mac/统一内存 0.5
预填充 tok/s = FP16 TFLOPS × 卡数 × 0.45 ÷ (2 × 激活参数)
量化选择：在能装下的前提下取最高精度（BF16 > FP8 > Q8 > Q6 > Q5 > Q4）
MoE：解码只读激活参数；权重全部驻留显存（不做专家 offload）
未建模 KV 的模型（缺层数 / 头数）：只按权重判断能否装下
误差 ±30%；llama.cpp 单卡通常接近上限，vLLM 多卡略低，PCIe 多卡再打折`)}</pre>
      </Section>
      <p className="text-xs text-muted">{t('显卡表在')} <code>data/hardware.json</code>{t('，带宽 / 算力为公开规格，价格为参考。')}<Link to="/calculator" className="link">{t('按精确上下文与并发算显存 →')}</Link></p>
    </div>
  )
}
