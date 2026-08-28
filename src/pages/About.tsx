import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { meta, models } from '@/lib/catalog'

const md = `
## 这是什么
**${meta.site_name}** 是给工程师与选型者用的模型决策站：排行榜当入口，模型说明书当核心资产。分数告诉你选什么；架构、参数、显存、许可证、推理逻辑告诉你为什么选、能不能自己跑、成本多少。

## 明确不做
- 不发明「上帝综合分」当唯一真相（综合参考分只是可选排序键）。
- 不把开源与闭源硬揉成同一套公平分。
- 不用 AI 自动生成未核对的架构 / 参数细节。
- 不做社区投票主榜。
- **不做后端**：无自建 API、无数据库、无登录、无运行时抓取。数据全部是仓库里的静态 JSON，构建时打进前端。

## 数据来源声明
- 规格：官方模型卡、技术报告、Hugging Face 配置文件。
- 分数：厂商公布（标 official）、LMArena / Artificial Analysis（标 independent）。
- 价格：官方定价页；开源模型无官方 API 时用第三方托管常见价并标「托管」。
- 显存：官方 / 社区量化文件大小；缺失则按公式估算并标「估」。
- 当前收录 ${models.length} 个模型，${models.filter((m) => m.complete).length} 个有完整说明书，其余为速览。

## 内容政策
1. 模型官方名永远用英文官方字符串。
2. 闭源参数量未公开就写「未披露」。
3. 厂商自称的 SOTA 标 official，不写成独立复测。
4. 许可证逐字抄官方，不把「可下载」写成「完全开源免费商用」。
5. 坑与短板必须写；全是优点的页面视为未完成。
6. 中文能力单独评价。

## 如何贡献 / 更新数据
1. 编辑 \`data/models/<id>.json\`（规格与文案）或 \`scripts/merge-scores.mjs\`（分数快照）。
2. 运行 \`npm run data\` 合并并校验，再 \`npm run build\`。
3. 部署 \`dist/\` 到任意静态托管。

## 技术
Vite + React + TypeScript + Tailwind，Recharts 画图，Fuse.js 浏览器内搜索，react-markdown 渲染说明书。构建产物为纯静态文件。
`

export default function About() {
  return (
    <article className="max-w-3xl space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">关于</h1>
      <div className="md text-sm md:text-[15px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown></div>
      <p className="text-xs text-muted pt-4 border-t border-border">版本 {meta.version} · 数据更新 {meta.generated_at}</p>
    </article>
  )
}
