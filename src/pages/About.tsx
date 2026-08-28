import { useSeo } from '@/hooks/useSeo'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { meta, models } from '@/lib/catalog'
import { useT, type Lang } from '@/i18n'

const complete = models.filter((m) => m.complete).length

export function buildMd(lang: Lang): string {
  if (lang === 'en') return `
## What this is
**${meta.site_name}** is a model decision site for engineers and people choosing models: the leaderboard is the entry point, the model spec sheets are the core asset. Scores tell you what to pick; architecture, parameters, VRAM, license and reasoning behavior tell you why, whether you can run it yourself, and what it costs.

## Explicitly out of scope
- No invented "god composite score" as the single truth (the composite reference score is only an optional sort key).
- No forcing open and closed models into one "fair" score.
- No AI-generated, unverified architecture / parameter details.
- No community-vote main leaderboard.
- **No backend**: no self-hosted API, no database, no login, no runtime scraping. All data is static JSON in the repository, bundled into the frontend at build time.

## Data source statement
- Specs: official model cards, technical reports, Hugging Face config files.
- Scores: vendor-published (marked official), LMArena / Artificial Analysis (marked independent).
- Prices: official pricing pages; for open models without an official API, the typical third-party hosted price, marked "hosted".
- VRAM: official / community quantized file sizes; when missing, estimated by formula and marked "est.".
- Currently ${models.length} models are included, ${complete} with a complete spec sheet, the rest as quick overviews.

## Content policy
1. Official model names always use the official English string.
2. Undisclosed closed-model parameter counts are written as "undisclosed".
3. Vendor-claimed SOTA is marked official, never as an independent re-test.
4. Licenses are copied verbatim from the official source; "downloadable" is never written as "fully open, free for commercial use".
5. Pitfalls and weaknesses must be written; a page with only strengths is considered unfinished.
6. Chinese-language ability is evaluated separately.

## How to contribute / update data
1. Edit \`data/models/<id>.json\` (specs and copy) or \`scripts/merge-scores.mjs\` (score snapshot).
2. Run \`npm run data\` to merge and validate, then \`npm run build\`.
3. Deploy \`dist/\` to any static host.

## Author and open source
- Author: [Tan Zhuo](https://tanzhuo.xyz) (blog tanzhuo.xyz)
- Source: [github.com/tan-zhuo/AI-Gallery](https://github.com/tan-zhuo/AI-Gallery) — issues / PRs adding models or correcting data are welcome.

## Tech
Vite + React + TypeScript + Tailwind, Recharts for charts, Fuse.js for in-browser search, react-markdown for rendering spec sheets. The build output is pure static files.
`
  if (lang === 'ja') return `
## これは何か
**${meta.site_name}** はエンジニアとモデル選定者向けのモデル意思決定サイト：ランキングが入口、モデル仕様書がコア資産。スコアは何を選ぶかを教え、アーキテクチャ・パラメータ・VRAM・ライセンス・推論の挙動は、なぜ選ぶのか、自分で動かせるのか、コストはいくらかを教える。

## 明確にやらないこと
- 唯一の真理としての「神の総合スコア」を発明しない（総合参考スコアは任意のソートキーにすぎない）。
- オープンとクローズドを無理に同じ「公平な」スコアに押し込めない。
- AI で未検証のアーキテクチャ / パラメータ詳細を自動生成しない。
- コミュニティ投票のメインランキングは作らない。
- **バックエンドを持たない**：自前 API なし、データベースなし、ログインなし、実行時スクレイピングなし。データはすべてリポジトリ内の静的 JSON で、ビルド時にフロントエンドへ組み込む。

## データソースの表明
- スペック：公式モデルカード、技術報告、Hugging Face の設定ファイル。
- スコア：ベンダー公表（official と表示）、LMArena / Artificial Analysis（independent と表示）。
- 価格：公式料金ページ。オープンモデルに公式 API がない場合はサードパーティホスティングの一般的な価格を使い「ホスト」と表示。
- VRAM：公式 / コミュニティの量子化ファイルサイズ。欠損時は式で見積もり「推定」と表示。
- 現在 ${models.length} モデルを収録、うち ${complete} モデルに完全な仕様書があり、残りは概要のみ。

## コンテンツポリシー
1. モデルの公式名は常に英語の公式文字列を使う。
2. クローズドモデルのパラメータ数が未公開なら「非公開」と書く。
3. ベンダーが自称する SOTA は official と表示し、独立再測定とは書かない。
4. ライセンスは公式をそのまま転記し、「ダウンロード可能」を「完全オープンで商用無料」とは書かない。
5. 落とし穴と弱点は必ず書く。長所しかないページは未完成とみなす。
6. 中国語能力は個別に評価する。

## 貢献 / データ更新の方法
1. \`data/models/<id>.json\`（スペックと文章）または \`scripts/merge-scores.mjs\`（スコアのスナップショット）を編集。
2. \`npm run data\` でマージと検証を行い、次に \`npm run build\`。
3. \`dist/\` を任意の静的ホスティングにデプロイ。

## 作者とオープンソース
- 作者：[譚卓（Tan Zhuo）](https://tanzhuo.xyz)（ブログ tanzhuo.xyz）
- ソース：[github.com/tan-zhuo/AI-Gallery](https://github.com/tan-zhuo/AI-Gallery)。モデル追加やデータ修正の issue / PR を歓迎。

## 技術
Vite + React + TypeScript + Tailwind、グラフは Recharts、ブラウザ内検索は Fuse.js、仕様書のレンダリングは react-markdown。ビルド成果物は純粋な静的ファイル。
`
  return `
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
- 当前收录 ${models.length} 个模型，${complete} 个有完整说明书，其余为速览。

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

## 作者与开源
- 作者：[谭卓](https://tanzhuo.xyz)（博客 tanzhuo.xyz）
- 开源地址：[github.com/tan-zhuo/AI-Gallery](https://github.com/tan-zhuo/AI-Gallery)，欢迎 issue / PR 补充模型与修正数据。

## 技术
Vite + React + TypeScript + Tailwind，Recharts 画图，Fuse.js 浏览器内搜索，react-markdown 渲染说明书。构建产物为纯静态文件。
`
}

export default function About() {
  const { t, lang } = useT()
  useSeo({ title: t('关于'), description: t('AI-Gallery 是什么、数据来源声明、内容政策与贡献方式。作者谭卓。'), path: '/about' })
  return (
    <article className="max-w-3xl space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{t('关于')}</h1>
      <div className="md text-sm md:text-[15px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{buildMd(lang)}</ReactMarkdown></div>
      <p className="text-xs text-muted pt-4 border-t border-border">{t('版本 {v} · 数据更新 {d}', { v: meta.version, d: meta.generated_at })}</p>
    </article>
  )
}
