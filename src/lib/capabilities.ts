import type { Model } from './types'
import { scoreMap } from './catalog'
import { getScore } from './scoring'
import type { RadarPoint } from '@/components/charts/Radar'

/** 雷达图数据：直接用基准原始百分比；Elo 类归一到 0–100（1200→0, 1520→100） */
export function radarFor(m: Model): RadarPoint[] {
  const g = (k: string) => getScore(scoreMap, m.id, k)?.value
  const elo = (v?: number) => (v == null ? undefined : Math.max(0, Math.min(100, ((v - 1200) / 320) * 100)))
  return [
    { axis: '编程', value: g('swe_verified') ?? g('livecodebench') ?? g('scicode') },
    { axis: '推理', value: g('gpqa_diamond') },
    { axis: '数学', value: g('aime_2025') ?? g('aime_2026') },
    { axis: '人类偏好', value: elo(g('arena_text')) },
    { axis: 'Agent', value: g('tau2_bench') ?? g('terminal_bench') ?? g('tb_hard') ?? g('tau2_telecom') },
    { axis: '多模态', value: m.modalities.includes('image') ? (g('mmmu') ?? g('mmmu_pro')) : undefined },
    { axis: '中文', value: elo(g('arena_zh')) },
  ]
}
