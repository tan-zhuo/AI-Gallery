import type { Model, Scene, Tab } from './types'
import { models, scoreMap } from './catalog'
import { computeReferenceScores, filterScene, filterTab, sceneWeights, tieBreak, valueScore, getScore, type RefScore } from './scoring'

export interface Row {
  m: Model
  rank: number
  ref: RefScore
  refScore?: number
  value?: number
  elo?: number
  aa?: number
  coding?: number
  reasoning?: number
  math?: number
  agent?: number
  mm?: number
}

export const SCENES: Array<{ key: Scene; label: string; desc: string }> = [
  { key: 'overall', label: '综合', desc: '默认权重：AA 指数 35% · Arena 25% · 代码 20% · 推理 20%' },
  { key: 'coding', label: '编程', desc: 'SWE-bench Verified / LiveCodeBench 权重 55%' },
  { key: 'reasoning', label: '推理', desc: 'GPQA Diamond / HLE 权重 55%' },
  { key: 'math', label: '数学', desc: 'AIME 2025 权重 55%' },
  { key: 'agent', label: 'Agent', desc: 'τ²-bench / Terminal-Bench 权重 55%' },
  { key: 'long-context', label: '长上下文', desc: '仅 ≥256K 上下文的模型，按综合分排序' },
  { key: 'multimodal', label: '多模态', desc: '仅支持图像输入的模型，MMMU 权重 55%' },
  { key: 'chinese', label: '中文', desc: 'LMArena 中文 Elo 权重 55%' },
  { key: 'single-gpu', label: '单卡可跑', desc: '开源且 Q4 权重 ≤ 24GB（含 10% 余量），按综合分排序' },
  { key: 'value', label: '性价比', desc: '综合分 / log(输入价格)，仅含有官方或常见托管价的模型' },
]

/** 基于 tab + scene 计算榜单行。全部在浏览器完成。 */
export function buildRows(tab: Tab, scene: Scene, onlyVerified = false, includeSuperseded = false): Row[] {
  let peers = filterTab(includeSuperseded ? models : models.filter((m) => m.status !== 'superseded' && m.status !== 'deprecated'), tab)
  peers = filterScene(peers, scene, scoreMap)
  if (onlyVerified) peers = peers.filter((m) => getScore(scoreMap, m.id, 'aa_index') || getScore(scoreMap, m.id, 'arena_text'))
  const refs = computeReferenceScores(peers, scoreMap, sceneWeights(scene))
  const rows: Row[] = peers.map((m) => {
    const ref = refs.get(m.id)!
    const g = (k: string) => getScore(scoreMap, m.id, k)?.value
    return {
      m, rank: 0, ref, refScore: ref.score,
      value: valueScore(ref.score, m.pricing?.input_per_m),
      elo: g('arena_text'), aa: g('aa_index'),
      coding: g('swe_verified') ?? g('livecodebench'),
      reasoning: g('gpqa_diamond'), math: g('aime_2025'),
      agent: g('tau2_bench') ?? g('terminal_bench'), mm: g('mmmu'),
    }
  })
  const key: keyof Row = scene === 'value' ? 'value' : 'refScore'
  rows.sort((a, b) => {
    const av = a[key] as number | undefined, bv = b[key] as number | undefined
    if (av == null && bv == null) return tieBreak(a.m, b.m, scoreMap)
    if (av == null) return 1
    if (bv == null) return -1
    if (Math.abs(av - bv) > 1e-6) return bv - av
    return tieBreak(a.m, b.m, scoreMap)
  })
  rows.forEach((r, i) => { r.rank = i + 1 })
  return rows
}
