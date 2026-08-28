import type { Model } from './types'
import { BYTES_PER_PARAM, QUANT_LABEL, type CalcQuant } from './vram'
import { activeParamsB, totalParamsB, weightGb, kvKib, type Gpu } from './perf'

export type Interconnect = 'nvlink' | 'pcie' | 'unified'
export interface ClusterSpec {
  gpu: Gpu
  perNode: number        // 每机卡数
  nodes: number          // 机器台数
  precision: 'auto' | CalcQuant
  context: number
  batch: number
  kwhPrice: number       // ¥/kWh
  hoursPerDay: number
  deprecationMonths: number
  fxUsdCny: number
}
export const CONTEXTS = [4096, 8192, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152]
export const QUANTS: CalcQuant[] = ['bf16', 'fp8', 'q8', 'q6', 'q5', 'q4']
const OVERHEAD_GB = 1.2

/** 带宽效率：单卡 → 机内并行 → 跨机 */
export function decodeEff(spec: ClusterSpec): { eff: number; note: string } {
  const { gpu, perNode, nodes } = spec
  if (gpu.tier === 'mac') return { eff: 0.5, note: '统一内存' }
  let eff = perNode === 1 ? 0.65 : gpu.interconnect === 'nvlink' ? 0.55 : 0.45
  let note = perNode === 1 ? '单卡' : gpu.interconnect === 'nvlink' ? 'NVLink 张量并行' : 'PCIe 张量并行'
  if (nodes > 1) { eff *= 0.8; note += ' + 跨机（IB/RoCE）' }
  return { eff, note }
}

export interface ClusterSummary {
  gpus: number; vram: number; bandwidth: number; tflops: number
  powerKw: number; capexCny: number; cloudUsdH?: number
  monthlyElecCny: number; monthlyDepCny: number; monthlyTotalCny: number
}
export function summarize(spec: ClusterSpec): ClusterSummary {
  const gpus = spec.perNode * spec.nodes
  const powerKw = (gpus * spec.gpu.tdp_w + spec.nodes * spec.gpu.node_base_w) / 1000
  const capexCny = gpus * spec.gpu.price_cny + spec.nodes * spec.gpu.node_base_cny
  const monthlyElecCny = powerKw * spec.hoursPerDay * 30 * spec.kwhPrice
  const monthlyDepCny = capexCny / spec.deprecationMonths
  return {
    gpus, vram: gpus * spec.gpu.vram_gb, bandwidth: gpus * spec.gpu.bandwidth_gbs, tflops: gpus * spec.gpu.fp16_tflops,
    powerKw, capexCny, cloudUsdH: spec.gpu.cloud_usd_h != null ? spec.gpu.cloud_usd_h * gpus : undefined,
    monthlyElecCny, monthlyDepCny, monthlyTotalCny: monthlyElecCny + monthlyDepCny,
  }
}

export interface ModelRun {
  m: Model
  quant?: CalcQuant
  weightGb?: number; kvGb?: number; totalGb?: number
  fits: boolean; shortfallGb?: number; reason?: string
  kvModeled: boolean; estimatedWeight: boolean
  single?: number       // 单流解码 tok/s
  aggregate?: number    // 并发聚合 tok/s
  computeCap?: number   // 算力上限 tok/s
  prefill?: number
  maxContext?: number
  cnyPerMTok?: number   // 含折旧
  cnyPerMTokElec?: number
  apiCnyPerMTok?: number
}

export function runModel(m: Model, spec: ClusterSpec, sum: ClusterSummary): ModelRun {
  const base: ModelRun = { m, fits: false, kvModeled: false, estimatedWeight: false }
  if (!m.weights_available) return { ...base, reason: '闭源' }
  if (totalParamsB(m) == null) return { ...base, reason: '参数未披露' }
  const kib = kvKib(m)
  const kvBytesPerTok = (q: CalcQuant) => (kib != null ? kib * 1024 * (q === 'fp8' ? 0.5 : 1) : 0)
  const tryQ = (q: CalcQuant) => {
    const w = weightGb(m, q); if (!w) return undefined
    const kvGb = (kvBytesPerTok(q) * spec.context * spec.batch) / 1024 ** 3
    const total = w.gb + kvGb + OVERHEAD_GB * sum.gpus
    return { q, w, kvGb, total }
  }
  const cands = spec.precision === 'auto' ? QUANTS : [spec.precision]
  let pick: ReturnType<typeof tryQ> | undefined
  for (const q of cands) { const c = tryQ(q); if (c && c.total <= sum.vram) { pick = c; break } }
  if (!pick) {
    const c = tryQ(spec.precision === 'auto' ? 'q4' : spec.precision)
    return { ...base, quant: c?.q, weightGb: c?.w.gb, kvGb: c?.kvGb, totalGb: c?.total, kvModeled: kib != null, estimatedWeight: !!c?.w.estimated, shortfallGb: c ? c.total - sum.vram : undefined, reason: '显存不足' }
  }
  const { eff } = decodeEff(spec)
  const act = activeParamsB(m) ?? 0
  const wBytes = act * 1e9 * BYTES_PER_PARAM[pick.q]
  const kvB = kvBytesPerTok(pick.q) * spec.context
  const bwBytes = sum.bandwidth * 1e9 * eff
  const single = bwBytes / (wBytes + kvB)
  const computeCap = (sum.tflops * 1e12 * 0.45) / (2 * act * 1e9)
  const aggregate = Math.min((spec.batch * bwBytes) / (wBytes + spec.batch * kvB), computeCap)
  const prefill = computeCap
  const maxContext = kvBytesPerTok(pick.q) > 0 ? Math.floor(((sum.vram - pick.w.gb - OVERHEAD_GB * sum.gpus) * 1024 ** 3) / (kvBytesPerTok(pick.q) * spec.batch)) : undefined
  const hourElec = sum.powerKw * spec.kwhPrice
  const hourDep = sum.monthlyDepCny / (30 * spec.hoursPerDay)
  const mtokPerHour = (aggregate * 3600) / 1e6
  const apiCny = m.pricing?.output_per_m != null ? m.pricing.output_per_m * spec.fxUsdCny : undefined
  return {
    m, quant: pick.q, weightGb: pick.w.gb, kvGb: pick.kvGb, totalGb: pick.total, fits: true, kvModeled: kib != null, estimatedWeight: pick.w.estimated,
    single, aggregate, computeCap, prefill, maxContext,
    cnyPerMTokElec: hourElec / mtokPerHour, cnyPerMTok: (hourElec + hourDep) / mtokPerHour, apiCnyPerMTok: apiCny,
  }
}

export const quantLabel = (q?: CalcQuant) => (q ? QUANT_LABEL[q] : '—')
