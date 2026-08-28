import type { Model, ScoreRow, Scene, Tab } from './types'
import { fitsIn } from './vram'

/** key → 用于综合分的分量 */
export const COMPONENT_KEYS = {
  independent_index: ['aa_index'],
  arena_elo: ['arena_text'],
  coding: ['swe_verified', 'livecodebench', 'scicode'],
  reasoning: ['gpqa_diamond', 'hle'],
  math: ['aime_2025', 'aime_2026'],
  agent: ['tau2_bench', 'terminal_bench', 'tb_hard', 'tau2_telecom', 'tau3_banking'],
  multimodal: ['mmmu', 'mmmu_pro'],
  chinese: ['arena_zh', 'ceval'],
  long_context: ['mrcr_128k'],
} as const
export type Component = keyof typeof COMPONENT_KEYS

export const DEFAULT_WEIGHTS: Partial<Record<Component, number>> = {
  independent_index: 0.35,
  arena_elo: 0.25,
  coding: 0.2,
  reasoning: 0.2,
}

export function sceneWeights(scene: Scene): Partial<Record<Component, number>> {
  const base: Partial<Record<Component, number>> = { independent_index: 0.35, arena_elo: 0.25, coding: 0.2, reasoning: 0.2 }
  const focus = (k: Component): Partial<Record<Component, number>> => {
    const others = (Object.keys(base) as Component[]).filter((x) => x !== k)
    const w: Partial<Record<Component, number>> = { [k]: 0.55 }
    for (const o of others) w[o] = 0.45 / others.length
    return w
  }
  switch (scene) {
    case 'coding': return focus('coding')
    case 'reasoning': return focus('reasoning')
    case 'math': return focus('math')
    case 'agent': return focus('agent')
    case 'multimodal': return focus('multimodal')
    case 'chinese': return focus('chinese')
    case 'long-context': return focus('long_context')
    default: return base
  }
}

/** 至少覆盖两个分量（权重和 ≥ 0.45）才给出参考分，避免单一官方分数把模型顶到榜首 */
export const MIN_WEIGHT = 0.45

export type ScoreMap = Map<string, Map<string, ScoreRow>> // model_id -> key -> row

export function buildScoreMap(rows: ScoreRow[]): ScoreMap {
  const m: ScoreMap = new Map()
  for (const r of rows) {
    if (!m.has(r.model_id)) m.set(r.model_id, new Map())
    const cur = m.get(r.model_id)!.get(r.key)
    // 同一基准多条记录：独立复测优先，其次取较新的
    if (!cur || (r.evidence === 'independent' && cur.evidence !== 'independent') || (r.evidence === cur.evidence && r.as_of > cur.as_of)) m.get(r.model_id)!.set(r.key, r)
  }
  return m
}

export function getScore(sm: ScoreMap, id: string, key: string): ScoreRow | undefined {
  return sm.get(id)?.get(key)
}

/** 取分量原始值：多 key 时取第一个存在的 */
export function componentRaw(sm: ScoreMap, id: string, c: Component): number | undefined {
  for (const k of COMPONENT_KEYS[c]) {
    const r = getScore(sm, id, k)
    if (r) return r.value
  }
  return undefined
}

export interface RefScore {
  score?: number
  partial: boolean
  used: Component[]
  missing: Component[]
}

function minmax(vals: number[]): (v: number) => number {
  const lo = Math.min(...vals), hi = Math.max(...vals)
  return (v) => (hi === lo ? 100 : ((v - lo) / (hi - lo)) * 100)
}

/**
 * 综合参考分（方法论页原样展示）：
 * score = Σ w_i · norm_i(x_i)，norm 在 peerSet 内 min-max 到 0–100；缺项权重按现有项重分配。
 */
export function computeReferenceScores(
  peers: Model[],
  sm: ScoreMap,
  weights: Partial<Record<Component, number>> = DEFAULT_WEIGHTS,
): Map<string, RefScore> {
  const comps = (Object.keys(weights) as Component[]).filter((c) => (weights[c] ?? 0) > 0)
  const norms = new Map<Component, (v: number) => number>()
  for (const c of comps) {
    const vals = peers.map((m) => componentRaw(sm, m.id, c)).filter((v): v is number => v != null)
    if (vals.length >= 2) norms.set(c, minmax(vals))
  }
  const out = new Map<string, RefScore>()
  for (const m of peers) {
    let wsum = 0, acc = 0
    const used: Component[] = [], missing: Component[] = []
    for (const c of comps) {
      const raw = componentRaw(sm, m.id, c)
      const n = norms.get(c)
      if (raw != null && n) { acc += (weights[c] ?? 0) * n(raw); wsum += weights[c] ?? 0; used.push(c) }
      else missing.push(c)
    }
    out.set(m.id, wsum >= MIN_WEIGHT ? { score: acc / wsum, partial: missing.length > 0, used, missing } : { partial: true, used, missing })
  }
  return out
}

export function isOpenWeights(m: Model): boolean {
  return m.openness === 'open-weights' && m.weights_available
}

export function filterTab(models: Model[], tab: Tab): Model[] {
  if (tab === 'open') return models.filter(isOpenWeights)
  if (tab === 'closed') return models.filter((m) => !isOpenWeights(m))
  return models
}

export function filterScene(models: Model[], scene: Scene, sm: ScoreMap): Model[] {
  if (scene === 'single-gpu') return models.filter((m) => isOpenWeights(m) && fitsIn(m, 24))
  if (scene === 'value') return models.filter((m) => m.pricing?.input_per_m != null)
  if (scene === 'multimodal') return models.filter((m) => m.modalities.includes('image'))
  if (scene === 'long-context') return models.filter((m) => (m.context.max_tokens ?? 0) >= 256_000)
  if (scene === 'chinese') return models.filter((m) => componentRaw(sm, m.id, 'chinese') != null)
  return models
}

/** 性价比：参考分 / log(价格)。仅有官方价者参与。 */
export function valueScore(ref?: number, price?: number): number | undefined {
  if (ref == null || price == null || price <= 0) return undefined
  return ref / Math.log10(price * 10 + 2)
}

export function evidenceRank(sm: ScoreMap, id: string): number {
  let n = 0
  sm.get(id)?.forEach((r) => { if (r.evidence === 'independent') n++ })
  return n
}

/** 同分规则：证据等级 → 更新日期 → 名称字母序 */
export function tieBreak(a: Model, b: Model, sm: ScoreMap): number {
  const e = evidenceRank(sm, b.id) - evidenceRank(sm, a.id)
  if (e) return e
  const d = b.updated_at.localeCompare(a.updated_at)
  if (d) return d
  return a.name.localeCompare(b.name)
}
