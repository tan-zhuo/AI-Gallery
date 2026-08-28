import type { Model } from './types'
import hardwareJson from '../../data/hardware.json'
import { BYTES_PER_PARAM, QUANT_LABEL, type CalcQuant } from './vram'
import { paramsB } from './format'

export interface Gpu {
  id: string; name: string; tier: 'consumer' | 'workstation' | 'datacenter' | 'mac'
  vram_gb: number; bandwidth_gbs: number; fp16_tflops: number; price_hint: string; price_cny: number; max_count: number; note?: string
}
export const GPUS = hardwareJson as Gpu[]
export const TIER_LABEL: Record<Gpu['tier'], string> = { consumer: '消费级', workstation: '工作站', datacenter: '数据中心', mac: '统一内存' }

const OVERHEAD_GB = 1.2          // CUDA context / 激活 / 碎片
const DECODE_EFF = { single: 0.65, multi: 0.55, mac: 0.5 }
const PREFILL_EFF = 0.45
export const QUANTS_ORDER: CalcQuant[] = ['bf16', 'fp8', 'q8', 'q6', 'q5', 'q4']

export function totalParamsB(m: Model) { return m.architecture.total_params_b ?? paramsB(m.architecture.total_params) }
export function activeParamsB(m: Model) { return m.architecture.active_params_b ?? paramsB(m.architecture.active_params) ?? totalParamsB(m) }

/** 权重 GB：优先数据表里的真实文件大小，否则按系数估算 */
export function weightGb(m: Model, q: CalcQuant): { gb: number; estimated: boolean } | undefined {
  const known = (m.memory.weight_gb as Record<string, number | undefined>)[q]
  if (known != null) return { gb: known, estimated: false }
  const p = totalParamsB(m)
  if (p == null) return undefined
  return { gb: p * BYTES_PER_PARAM[q], estimated: true }
}

/** 每 token KV（KiB）：数据表 > 架构公式 > 未知 */
export function kvKib(m: Model): number | undefined {
  if (m.memory.kv_per_token_kib) return m.memory.kv_per_token_kib
  const a = m.architecture
  const L = a.kv_layers ?? a.layers
  if (L && a.kv_heads && a.head_dim) return (L * a.kv_heads * a.head_dim * 2 * 2) / 1024
  return undefined
}

export interface PerfEstimate {
  gpu: Gpu; count: number; quant: CalcQuant
  weight_gb: number; kv_gb: number; total_gb: number; vram_gb: number
  fits: boolean; max_context?: number
  decode_tok_s?: number; prefill_tok_s?: number
  estimated_weight: boolean; kv_modeled: boolean
}

/** 单流吞吐估算：解码受显存带宽限制，预填充受算力限制 */
export function estimatePerf(m: Model, gpu: Gpu, count: number, quant: CalcQuant, context = 8192): PerfEstimate | undefined {
  const w = weightGb(m, quant)
  if (!w) return undefined
  const kib = kvKib(m)
  const kvBytesPerTok = kib != null ? kib * 1024 * (quant === 'fp8' ? 0.5 : 1) : 0
  const kv_gb = (kvBytesPerTok * context) / 1024 ** 3
  const vram = gpu.vram_gb * count
  const total = w.gb + kv_gb + OVERHEAD_GB * count
  const fits = total <= vram
  const max_context = kvBytesPerTok > 0 ? Math.max(0, Math.floor(((vram - w.gb - OVERHEAD_GB * count) * 1024 ** 3) / kvBytesPerTok)) : undefined
  let decode: number | undefined, prefill: number | undefined
  if (fits) {
    const act = activeParamsB(m) ?? 0
    const bytesPerTok = act * 1e9 * BYTES_PER_PARAM[quant] + kvBytesPerTok * context
    const eff = gpu.tier === 'mac' ? DECODE_EFF.mac : count > 1 ? DECODE_EFF.multi : DECODE_EFF.single
    decode = (gpu.bandwidth_gbs * 1e9 * count * eff) / bytesPerTok
    prefill = (gpu.fp16_tflops * 1e12 * count * PREFILL_EFF) / (2 * act * 1e9)
  }
  return { gpu, count, quant, weight_gb: w.gb, kv_gb, total_gb: total, vram_gb: vram, fits, max_context, decode_tok_s: decode, prefill_tok_s: prefill, estimated_weight: w.estimated, kv_modeled: kib != null }
}

export interface ConfigOption { est: PerfEstimate; label: string }

/** 给一个模型列出每种显卡的最小可跑配置（最高质量量化优先），按显卡顺序 */
export function configsFor(m: Model, context = 8192): ConfigOption[] {
  const out: ConfigOption[] = []
  if (!m.weights_available || totalParamsB(m) == null) return out
  for (const gpu of GPUS) {
    let best: PerfEstimate | undefined
    for (let count = 1; count <= gpu.max_count && !best; count *= 2) {
      for (const q of QUANTS_ORDER) {
        const e = estimatePerf(m, gpu, count, q, context)
        if (e?.fits) { best = e; break }
      }
    }
    if (best) out.push({ est: best, label: `${best.count > 1 ? best.count + '× ' : ''}${gpu.name} · ${QUANT_LABEL[best.quant]}` })
  }
  return out
}

/** 最低可跑 / 推荐：最低 = 最便宜可跑；推荐 = 能以 ≥Q8/FP8 跑且 32K 上下文的最便宜配置 */
export function pickConfigs(m: Model) {
  const cost = (c: ConfigOption) => c.est.gpu.price_cny * c.est.count
  const all = configsFor(m, 8192)
  const minimal = [...all].sort((a, b) => cost(a) - cost(b))[0]
  const rec = configsFor(m, 32768).filter((c) => ['bf16', 'fp8', 'q8'].includes(c.est.quant) && (c.est.decode_tok_s ?? 0) >= 15).sort((a, b) => cost(a) - cost(b))[0]
  return { minimal, recommended: rec, all }
}

/** 反向：给一张卡 × 数量，列出能跑的模型与最佳量化 */
export function modelsForGpu(models: Model[], gpu: Gpu, count: number, context = 8192) {
  const rows: Array<{ m: Model; est: PerfEstimate }> = []
  for (const m of models) {
    if (!m.weights_available) continue
    for (const q of QUANTS_ORDER) {
      const e = estimatePerf(m, gpu, count, q, context)
      if (e?.fits) { rows.push({ m, est: e }); break }
    }
  }
  return rows
}

export function fmtTok(n?: number) { return n == null ? '—' : n >= 100 ? Math.round(n).toString() : n.toFixed(n >= 10 ? 0 : 1) }
export function fmtCtx(n?: number) { return n == null ? '—' : n >= 1024 * 1024 ? `${(n / 1048576).toFixed(1)}M` : `${Math.round(n / 1024)}K` }
