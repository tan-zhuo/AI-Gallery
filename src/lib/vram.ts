import type { Model, Quant } from './types'
import { paramsB } from './format'

export type CalcQuant = 'bf16' | 'fp8' | 'q8' | 'q6' | 'q5' | 'q4'

export const BYTES_PER_PARAM: Record<CalcQuant, number> = {
  bf16: 2, fp8: 1, q8: 1.06, q6: 0.8, q5: 0.69, q4: 0.58,
}
export const QUANT_LABEL: Record<CalcQuant, string> = {
  bf16: 'BF16', fp8: 'FP8', q8: 'Q8_0', q6: 'Q6_K', q5: 'Q5_K_M', q4: 'Q4_K_M',
}
const WEIGHT_OVERHEAD = 1.08

export interface VramResult {
  weight_gb: number
  kv_gb?: number
  total_gb: number
  kv_modeled: boolean
  suggestion: string
  assumptions: string[]
}

export function suggestCard(totalGb: number): string {
  if (totalGb <= 15) return '16 GB（RTX 4080 / A4000 级）'
  if (totalGb <= 23) return '24 GB（RTX 3090 / 4090）'
  if (totalGb <= 46) return '48 GB（A6000 / L40S / 双 24GB）'
  if (totalGb <= 78) return '80 GB（A100 / H100）'
  if (totalGb <= 155) return '2 × 80 GB'
  if (totalGb <= 310) return '4 × 80 GB'
  if (totalGb <= 630) return '8 × 80 GB 节点'
  return '多节点（> 8 × 80 GB）'
}

/** 浏览器内纯函数：估算显存。公式与假设在计算器页底部原样展示。 */
export function estimateVram(model: Model, quant: CalcQuant, context: number, batch: number): VramResult {
  const a = model.architecture
  const pB = a.total_params_b ?? paramsB(a.total_params)
  const assumptions: string[] = []
  if (pB == null) {
    return { weight_gb: 0, total_gb: 0, kv_modeled: false, suggestion: '未披露参数量，无法估算', assumptions: ['该模型未披露参数量'] }
  }
  // 若数据里有更准的权重大小（如官方 GGUF 尺寸），优先用
  const known = (model.memory.weight_gb as Partial<Record<Quant, number>>)[quant as Quant]
  let weight = known != null ? known * 1.04 : pB * BYTES_PER_PARAM[quant] * WEIGHT_OVERHEAD
  assumptions.push(
    known != null
      ? `权重：使用数据表中 ${QUANT_LABEL[quant]} 文件大小 ${known} GB × 1.04 运行开销`
      : `权重 ≈ ${pB}B × ${BYTES_PER_PARAM[quant]} B/param × ${WEIGHT_OVERHEAD} 开销`,
  )
  let kv: number | undefined
  let modeled = false
  const L = a.kv_layers ?? a.layers
  if (L && a.kv_heads && a.head_dim) {
    const dtypeBytes = quant === 'bf16' ? 2 : quant === 'fp8' ? 1 : 2
    kv = (L * a.kv_heads * a.head_dim * 2 * context * batch * dtypeBytes * 1.2) / 1024 ** 3
    modeled = true
    assumptions.push(`KV ≈ ${L} 层${a.kv_layers ? "(全注意力层)" : ""} × ${a.kv_heads} KV头 × ${a.head_dim} head_dim × 2(K,V) × ${context.toLocaleString()} tok × ${batch} 并发 × ${dtypeBytes} B × 1.2 碎片系数`)
    if (a.attention?.includes('MLA')) assumptions.push('MLA 压缩 KV：此处按 kv_heads/head_dim 已换算成等效潜向量维度')
    if (a.attention?.toLowerCase().includes('deltanet') || a.attention?.toLowerCase().includes('linear') || a.attention?.toLowerCase().includes('mamba'))
      assumptions.push('混合线性注意力：仅对全注意力层计 KV，线性层状态忽略（偏保守低估）')
  } else {
    assumptions.push('缺少层数 / KV 头数：KV Cache 未建模，长上下文实际占用会显著高于此数')
  }
  const total = weight + (kv ?? 0)
  return { weight_gb: weight, kv_gb: kv, total_gb: total, kv_modeled: modeled, suggestion: suggestCard(total), assumptions }
}

export function fitsIn(model: Model, gb: number): boolean {
  const q4 = model.memory.weight_gb.q4
  if (q4 != null) return q4 * 1.1 <= gb
  const pB = model.architecture.total_params_b ?? paramsB(model.architecture.total_params)
  if (pB == null) return false
  return pB * BYTES_PER_PARAM.q4 * WEIGHT_OVERHEAD * 1.1 <= gb
}
