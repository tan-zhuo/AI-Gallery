// 本地构建脚本：生成 public/sitemap.xml、robots.txt、data/catalog.json（静态下载）。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const root = new URL('../', import.meta.url)
const meta = JSON.parse(readFileSync(new URL('data/meta.json', root), 'utf8'))
const models = JSON.parse(readFileSync(new URL('data/models.json', root), 'utf8'))
const scores = JSON.parse(readFileSync(new URL('data/scores.json', root), 'utf8'))
const site = (process.env.SITE_URL ?? meta.site_url).replace(/\/$/, '')
const topics = ['moe', 'attention', 'kv-cache', 'quantization', 'thinking', 'openness']
const scenes = ['coding', 'reasoning', 'math', 'agent', 'long-context', 'multimodal', 'chinese', 'single-gpu', 'value']
const urls = [
  ['/', '1.0', 'daily'], ['/leaderboard', '0.9', 'daily'], ['/models', '0.9', 'daily'], ['/hardware', '0.8', 'weekly'], ['/calculator', '0.7', 'monthly'],
  ['/compare', '0.5', 'monthly'], ['/architecture', '0.6', 'monthly'], ['/methodology', '0.5', 'monthly'], ['/changelog', '0.4', 'weekly'], ['/about', '0.3', 'monthly'],
  ...scenes.map((s) => [`/leaderboard/${s}`, '0.8', 'daily']),
  ...topics.map((t) => [`/architecture/${t}`, '0.6', 'monthly']),
  ...models.map((m) => [`/models/${m.id}`, m.status === 'superseded' ? '0.4' : '0.8', 'weekly', m.updated_at]),
]
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, pr, cf, lm]) => `  <url><loc>${site}${p}</loc><lastmod>${lm ?? meta.generated_at}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`
writeFileSync(new URL('public/sitemap.xml', root), xml)
writeFileSync(new URL('public/robots.txt', root), `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`)
mkdirSync(new URL('public/data/', root), { recursive: true })
writeFileSync(new URL('public/data/catalog.json', root), JSON.stringify({ meta, models, scores }))
console.log('seo: sitemap', urls.length, 'urls →', site)
