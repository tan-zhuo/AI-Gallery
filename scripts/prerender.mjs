// 构建期预渲染：vite build --ssr 产出 render()，对 sitemap 中的每个路由生成 dist/<route>/index.html
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const root = new URL('../', import.meta.url).pathname
const dist = join(root, 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')
const { render } = await import(join(root, 'dist-ssr', 'entry-prerender.js'))
const sitemap = readFileSync(join(root, 'public', 'sitemap.xml'), 'utf8')
const site = JSON.parse(readFileSync(join(root, 'data', 'meta.json'), 'utf8')).site_url.replace(/\/$/, '')
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(site, '') || '/')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
let n = 0, failed = []
for (const p of paths) {
  try {
    const { html, seo } = await render(p)
    let out = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
    if (seo) {
      out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(seo.title)}</title>`)
        .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(seo.description)}" />`)
        .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(seo.title)}" />`)
        .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(seo.description)}" />`)
        .replace('</head>', `    <link rel="canonical" href="${seo.url}" />\n    <meta property="og:url" content="${seo.url}" />\n${seo.jsonLd ? `    <script type="application/ld+json">${JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c')}</script>\n` : ''}  </head>`)
    }
    const dir = p === '/' ? dist : join(dist, p)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), out)
    n++
  } catch (e) { failed.push(`${p}: ${e.message}`) }
}
console.log(`prerender: ${n}/${paths.length} pages`, failed.length ? '\nFAILED:\n' + failed.join('\n') : '')
if (failed.length) process.exit(1)
