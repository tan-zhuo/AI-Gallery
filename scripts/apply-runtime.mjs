// 本地脚本：把 AA 的 API 速度写入 data/models/<id>.json 的 runtime 字段
import { readFileSync, writeFileSync } from 'node:fs'
import { AA } from './aa-2026-08.mjs'
let n = 0
for (const r of AA) {
  const [id] = r; const tok = r[13], ttft = r[14]
  if (tok == null && ttft == null) continue
  const p = new URL(`../data/models/${id}.json`, import.meta.url)
  const m = JSON.parse(readFileSync(p, 'utf8'))
  m.runtime = { ...(tok != null ? { tok_s: Math.round(tok) } : {}), ...(ttft != null ? { latency_s: Math.round(ttft * 100) / 100 } : {}), source: 'Artificial Analysis 官方 API 中位数（2026-08-28）' }
  writeFileSync(p, JSON.stringify(m, null, 1)); n++
}
console.log('runtime written:', n)
