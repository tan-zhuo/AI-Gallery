# AI-Gallery

面向工程师与选型者的 AI 模型百科 + 多维排行。**纯前端静态站**：无后端、无数据库、无登录、无运行时抓取。

## 开发

```bash
npm i
npm run dev        # 本地开发
npm run data       # 合并 data/models/*.json → data/models.json，生成 data/scores.json 并校验
npm run build      # = data + seo + tsc + vite build + 预渲染（dist/<route>/index.html，167 个静态页），产物在 dist/
npm run preview    # 本地预览 dist/
```

部署：把 `dist/` 放到任意静态托管（GitHub Pages / Cloudflare Pages / Netlify / Vercel 静态）。
- 子路径部署：`VITE_BASE=/repo/ npm run build`
- 每个路由都有真实 HTML（`dist/models/<id>/index.html` 等），静态托管直接可抓取；`public/404.html` 兜底未预渲染的路径（如 `/compare?ids=`）。
- 换域名：改 `data/meta.json` 的 `site_url`（影响 canonical / sitemap / robots）。

## 更新数据（人，不是服务器）

1. 规格与文案：编辑 `data/models/<id>.json`（一模型一文件；字段见 `src/lib/types.ts`）。
2. 分数快照：编辑 `scripts/merge-scores.mjs` 里的表格（每行一个模型，带来源与日期）。
3. 元信息：`data/meta.json`（数据截止日）、`data/changelog.json`。
4. `npm run data` 校验（id 与文件名一致、完整说明书必须 3 亮点 3 坑等），再 `npm run build`。

内容政策：闭源参数量一律「未披露」；厂商自称的分数标 `official`；许可证逐字抄官方；坑必须写。

## 目录

```
data/models/*.json     模型规格与说明书（源）
data/models.json       合并产物（提交到仓库）
data/scores.json       分数快照（由 scripts/merge-scores.mjs 生成）
data/benchmarks.json   基准定义
src/lib/catalog.ts     全站唯一数据入口（只 import 静态 JSON）
src/lib/scoring.ts     综合参考分 / 开源认定 / 同分规则
src/lib/vram.ts        显存估算纯函数
src/content/           架构图鉴文案
src/pages/             路由页面
```
