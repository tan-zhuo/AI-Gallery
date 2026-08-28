// 本地脚本：合并 data/models/*.json → data/models.json，并做基本校验。维护者电脑上跑，线上不依赖。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const dir = new URL('../data/models/', import.meta.url)
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
const models = []
const ids = new Set()
for (const f of files) {
  const m = JSON.parse(readFileSync(join(dir.pathname, f), 'utf8'))
  if (m.id !== f.replace(/\.json$/, '')) throw new Error(`${f}: id 与文件名不一致`)
  if (ids.has(m.id)) throw new Error(`重复 id ${m.id}`)
  ids.add(m.id)
  if (m.openness === 'open-weights' && !m.weights_available) throw new Error(`${m.id}: open-weights 必须 weights_available=true`)
  if (m.architecture.undisclosed && !m.weights_available && m.architecture.total_params && !/未披露|\+$/.test(m.architecture.total_params))
    console.warn(`警告 ${m.id}: 闭源模型写了参数量，请确认来自官方声明`)
  if (m.complete) {
    for (const k of ['highlights', 'pitfalls']) if ((m.copy[k] ?? []).length < 3) throw new Error(`${m.id}: 完整说明书需 3 条 ${k}`)
    if (!m.sheet?.architecture_md) throw new Error(`${m.id}: 完整说明书缺 architecture_md`)
  }
  models.push(m)
}
writeFileSync(new URL('../data/models.json', import.meta.url), JSON.stringify(models, null, 1))
console.log('models:', models.length, '| complete:', models.filter((m) => m.complete).length)
