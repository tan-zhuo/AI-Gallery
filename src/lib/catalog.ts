// 全站唯一数据入口：只读仓库内静态 JSON，禁止 fetch 自有 API。
import modelsJson from '../../data/models.json'
import scoresJson from '../../data/scores.json'
import benchmarksJson from '../../data/benchmarks.json'
import metaJson from '../../data/meta.json'
import changelogJson from '../../data/changelog.json'
import type { Model, ScoreRow, BenchmarkDef, Meta, ChangeEntry } from './types'
import { buildScoreMap } from './scoring'

export const models = modelsJson as Model[]
export const scores = scoresJson as ScoreRow[]
export const benchmarks = benchmarksJson as BenchmarkDef[]
export const meta = metaJson as Meta
export const changelog = changelogJson as ChangeEntry[]
export const scoreMap = buildScoreMap(scores)

const byId = new Map(models.map((m) => [m.id, m]))
const benchByKey = new Map(benchmarks.map((b) => [b.key, b]))

export function getAllModels(): Model[] { return models }
export function getModel(slug: string): Model | undefined { return byId.get(slug) }
export function getScores(modelId: string): ScoreRow[] { return scores.filter((s) => s.model_id === modelId) }
export function getBenchmark(key: string): BenchmarkDef | undefined { return benchByKey.get(key) }
export function vendors(): string[] { return [...new Set(models.map((m) => m.vendor))].sort() }
