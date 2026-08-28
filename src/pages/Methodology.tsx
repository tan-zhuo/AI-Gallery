import { useSeo } from '@/hooks/useSeo'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { meta, benchmarks } from '@/lib/catalog'
import { DEFAULT_WEIGHTS } from '@/lib/scoring'
import { useT, type Lang, type T } from '@/i18n'

const formula = Object.entries(DEFAULT_WEIGHTS).map(([k, w]) => `${w!.toFixed(2)} × norm(${k})`).join('\n      + ')

function benchList(t: T, lang: Lang) {
  return benchmarks.map((b) => {
    const alias = b.name_zh ? t(b.name_zh) : ''
    const desc = b.description ? t(b.description) : ''
    if (lang === 'zh') return `- **${b.name}**（${alias}，${b.category}）${desc ? '：' + desc : ''}`
    if (lang === 'ja') return `- **${b.name}**（${alias}、${b.category}）${desc ? '：' + desc : ''}`
    return `- **${b.name}** (${alias}, ${b.category})${desc ? ': ' + desc : ''}`
  }).join('\n')
}

export function buildMd(lang: Lang, t: T): string {
  const note = meta.note ? `> ${t(meta.note)}` : ''
  const list = benchList(t, lang)
  if (lang === 'en') return `
## 1. Data sources and cutoff date
- This site does **no automated scraping**. Every score, price and spec is a static file in the repository (\`data/models/*.json\`, \`data/scores.json\`), updated by hand by the maintainer and then rebuilt.
- Every score carries \`source\`, \`source_url\`, \`as_of\` and \`evidence\`. Any number on a page can be traced back to these four fields, or is explicitly marked "estimated" / "undisclosed".
- The current snapshot's data cutoff is **${meta.data_cutoff}**; the site was built on **${meta.generated_at}**.

${note}

## 2. How the composite reference score is computed
The "composite reference score" is only the **default sort key**, not the truth. The leaderboard also shows raw scores such as Arena Elo, the AA index, coding and reasoning, and the detail page lists every source.

\`\`\`
score = ${formula}

independent_index = Artificial Analysis Intelligence Index
arena_elo         = LMArena Text Elo (style control)
coding            = SWE-bench Verified，缺则 LiveCodeBench
reasoning         = GPQA Diamond，缺则 HLE
\`\`\`

- \`norm\`: min-max normalization to 0–100 within the **current leaderboard set** (composite / open / closed separately). The open and closed leaderboards are normalized separately so open models are not crushed by closed models' absolute values; the composite leaderboard normalizes over the full set.
- **Missing components**: that component is excluded, its weight is redistributed across the available ones, and the table marks the row "partial". If the sum of available weights is < 0.45 (i.e. only one component), no reference score is given and only raw scores are shown, so a single vendor number cannot push a model to the top.
- **Scenario leaderboards**: the matching scenario's weight is raised to 0.55 and the other three share 0.45 equally.
- **Value for money**: \`score / log10(input price × 10 + 2)\`, only for models with a public price. Open models without an official API use the typical third-party hosted price, marked "hosted".
- **Runs on one GPU**: open weights + Q4 weights × 1.1 ≤ 24 GB.
- **Ties**: first by number of independent re-tests, then by update date, then by name alphabetically.

## 3. Open / closed split
A model goes into "Open" only if both hold: weights downloadable; \`weights_available = true\`. API-only, or "promised open but weights not released", goes into closed. The license is listed separately: "open weights" ≠ "OSI open-source license" ≠ "commercial use allowed", see [Architecture · Open weights vs open license](/architecture/openness).

## 4. Evidence levels
| Level | Meaning | UI |
|---|---|---|
| official | Published by the vendor (model card / release post) | ○ gray |
| independent | Third-party independent re-test (LMArena, Artificial Analysis, etc.) | ● green |
| community | Community re-test or this site's estimate | ◐ yellow |
| unknown | Missing | — |

Vendor self-reported numbers are always marked official, never as independent re-tests.

## 5. VRAM estimation assumptions
\`\`\`
weight_mem ≈ params_b × bytes_per_param × 1.08
kv_mem     ≈ layers × kv_heads × head_dim × 2 × seq × batch × dtype_bytes × 1.2
\`\`\`
bytes_per_param: BF16 2 · FP8 1 · Q8 1.06 · Q6 0.8 · Q5 0.69 · Q4 0.58. Actual official / community file sizes take precedence when available. MLA is treated as a 576-dim latent vector equivalent; hybrid linear attention counts KV only for full-attention layers; sliding-window models count only global layers. Missing layer / head counts → "KV not modeled".

### 5.1 Hardware configuration and throughput estimates
\`\`\`
占用       = 权重(量化) + KV(上下文) + 1.2 GB × 卡数
解码 tok/s = 带宽 × 卡数 × eff ÷ (激活参数 × 每参数字节 + KV/token × 上下文)      eff：单卡 0.65 / 多卡 0.55 / 统一内存 0.5
预填充     = FP16 TFLOPS × 卡数 × 0.45 ÷ (2 × 激活参数)
\`\`\`
GPU specs live in \`data/hardware.json\`. "Minimum" = the cheapest feasible configuration at 8K context; "Recommended" = the cheapest configuration that runs 32K context at ≥Q8/FP8 with ≥15 tok/s. MoE decode reads only active parameters, but all weights stay resident in VRAM. Error margin ±30%, with a further discount for multi-GPU PCIe setups.

## 6. "Undisclosed" policy
For closed models, parameter count, layer count and architecture are always written as "undisclosed" — no guessing, no citing rumors. Anything the vendor has officially stated (e.g. "sparse MoE", "over 1T") is quoted verbatim with attribution.

## 7. Benchmarks included
${list}

## 8. Updates and contact
Data update = edit the repository JSON → rebuild → deploy. If you find an error, open an issue / PR in the repository.
`
  if (lang === 'ja') return `
## 1. データソースと締め日
- 本サイトは**自動スクレイピングをしない**。すべてのスコア・価格・スペックはリポジトリ内の静的ファイル（\`data/models/*.json\`、\`data/scores.json\`）で、メンテナが手動更新して再ビルドする。
- 各スコアには \`source\`、\`source_url\`、\`as_of\`、\`evidence\` が付く。ページ上のあらゆる数字はこの 4 項目に遡れるか、明示的に「推定」/「非公開」と表示される。
- 現在のスナップショットのデータ締め日は **${meta.data_cutoff}**、サイトのビルド日は **${meta.generated_at}**。

${note}

## 2. 総合参考スコアの計算方法
「総合参考スコア」は**デフォルトのソートキー**にすぎず、真理ではない。ランキングには Arena Elo、AA 指数、コーディング、推論などの生スコアも同時に表示し、詳細ページには全ソースを列挙する。

\`\`\`
score = ${formula}

independent_index = Artificial Analysis Intelligence Index
arena_elo         = LMArena Text Elo (style control)
coding            = SWE-bench Verified，缺则 LiveCodeBench
reasoning         = GPQA Diamond，缺则 HLE
\`\`\`

- \`norm\`：**現在のランキング集合**（総合 / オープン / クローズドをそれぞれ）内で min-max 正規化して 0–100 にする。オープンとクローズドは別々に正規化し、オープンがクローズドの絶対値に押し潰されるのを防ぐ。総合ランキングは全集合で正規化する。
- **欠損項目**：その成分は計算に含めず、重みを既存の項目に再配分し、表には「一部」と表示する。既存成分の重み合計が 0.45 未満（つまり成分が 1 つだけ）の場合は参考スコアを出さず生スコアのみ表示し、単一ベンダーの数字でモデルがトップに来るのを防ぐ。
- **シナリオ別ランキング**：該当シナリオの重みを 0.55 に上げ、残り 3 項目で 0.45 を等分する。
- **コストパフォーマンス**：\`score / log10(入力価格 × 10 + 2)\`、公開価格のあるモデルのみ。オープンモデルに公式 API がない場合はサードパーティホスティングの一般的な価格を使い「ホスト」と表示。
- **単一 GPU で動く**：オープンウェイト + Q4 重み × 1.1 ≤ 24 GB。
- **同点**：独立再測定の件数 → 更新日 → 名前のアルファベット順で比較。

## 3. オープン / クローズドの分離
次の 2 条件を両方満たすと「オープン」：重みがダウンロード可能；\`weights_available = true\`。API のみ、または「オープン化を約束したが重み未公開」はクローズドに分類。ライセンスは別途表示し、「オープンウェイト」≠「OSI オープンソースライセンス」≠「商用利用可」。[アーキテクチャ図鑑 · オープンウェイト vs オープンライセンス](/architecture/openness) を参照。

## 4. エビデンスレベル
| レベル | 意味 | UI |
|---|---|---|
| official | ベンダー公表（モデルカード / リリース告知） | ○ グレー |
| independent | サードパーティによる独立再測定（LMArena、Artificial Analysis など） | ● 緑 |
| community | コミュニティの再測定または本サイトの推定 | ◐ 黄 |
| unknown | 欠損 | — |

ベンダーの自己申告の数字は一律 official とし、独立再測定とは書かない。

## 5. VRAM 見積もりの前提
\`\`\`
weight_mem ≈ params_b × bytes_per_param × 1.08
kv_mem     ≈ layers × kv_heads × head_dim × 2 × seq × batch × dtype_bytes × 1.2
\`\`\`
bytes_per_param：BF16 2 · FP8 1 · Q8 1.06 · Q6 0.8 · Q5 0.69 · Q4 0.58。公式 / コミュニティのファイルサイズがある場合は実測値を優先。MLA は 576 次元の潜在ベクトル相当として扱う。ハイブリッド線形アテンションはフルアテンション層のみ KV を計上し、スライディングウィンドウモデルはグローバル層のみ計上する。層数 / ヘッド数が不明 → 「KV 未モデル化」。

### 5.1 ハードウェア構成とスループット見積もり
\`\`\`
占用       = 权重(量化) + KV(上下文) + 1.2 GB × 卡数
解码 tok/s = 带宽 × 卡数 × eff ÷ (激活参数 × 每参数字节 + KV/token × 上下文)      eff：单卡 0.65 / 多卡 0.55 / 统一内存 0.5
预填充     = FP16 TFLOPS × 卡数 × 0.45 ÷ (2 × 激活参数)
\`\`\`
GPU のスペックは \`data/hardware.json\` にある。「最低構成」= 8K コンテキストで動く最安の構成；「推奨」= ≥Q8/FP8 で 32K コンテキストを ≥15 tok/s で動かせる最安の構成。MoE のデコードはアクティブパラメータのみ読むが、重みはすべて VRAM に常駐する。誤差 ±30%、マルチ GPU の PCIe 環境ではさらに割り引く。

## 6. 「非公開」ポリシー
クローズドモデルのパラメータ数・層数・アーキテクチャは一律「非公開」と書き、推測も噂の引用もしない。ベンダーが公式に明言したもの（「スパース MoE」「1T 超」など）は原文どおり書き、出典を注記する。

## 7. 収録ベンチマーク
${list}

## 8. 更新と連絡
データ更新 = リポジトリの JSON を修正 → 再ビルド → デプロイ。誤りを見つけたらリポジトリに issue / PR を。
`
  return `
## 1. 数据来源与截止日期
- 本站**没有自动抓取**。所有分数、价格、规格都是仓库里的静态文件（\`data/models/*.json\`、\`data/scores.json\`），由维护者手工更新后重新构建。
- 每条分数带 \`source\`、\`source_url\`、\`as_of\`、\`evidence\`。页面上任何数字都能追溯到这四项，或明确标「估计」/「未披露」。
- 当前快照数据截止 **${meta.data_cutoff}**，站点构建于 **${meta.generated_at}**。

${note}

## 2. 综合参考分怎么算
「综合参考分」只是**默认排序键**，不是真理。榜单同时展示 Arena Elo、AA 指数、代码、推理等原始分，详情页列出全部来源。

\`\`\`
score = ${formula}

independent_index = Artificial Analysis Intelligence Index
arena_elo         = LMArena Text Elo (style control)
coding            = SWE-bench Verified，缺则 LiveCodeBench
reasoning         = GPQA Diamond，缺则 HLE
\`\`\`

- \`norm\`：在**当前榜单集合**（综合 / 开源 / 闭源分别）内做 min-max 归一到 0–100。开源榜与闭源榜分别归一化，避免开源被闭源绝对值压死；综合榜用全集归一化。
- **缺项**：该分量不计入，权重按现有项重分配，并在表格里标「部分」。已有分量权重之和 < 0.45（即只有一个分量）时不给参考分，只显示原始分，避免单一厂商数字把模型顶到榜首。
- **场景榜**：对应场景权重提到 0.55，其余三项均分 0.45。
- **性价比**：\`score / log10(输入价格 × 10 + 2)\`，只含有公开价格的模型。开源模型若无官方 API，使用第三方托管常见价并标「托管」。
- **单卡可跑**：开源 + Q4 权重 × 1.1 ≤ 24 GB。
- **同分**：先比独立复测条数，再比更新日期，再比名称字母序。

## 3. 开源 / 闭源分列
同时满足以下两条进「开源」：权重可下载；\`weights_available = true\`。仅 API、或「承诺开源但未放权重」归入闭源。许可证另列，「开源权重」≠「OSI 开源许可」≠「可商用」，见 [架构图鉴 · 开源权重 vs 开放许可证](/architecture/openness)。

## 4. 证据等级
| 等级 | 含义 | UI |
|---|---|---|
| official | 厂商公布（模型卡 / 发布公告） | ○ 灰 |
| independent | 第三方独立复测（LMArena、Artificial Analysis 等） | ● 绿 |
| community | 社区复测或本站估算 | ◐ 黄 |
| unknown | 缺失 | — |

厂商自称的数字一律标 official，不写成独立复测。

## 5. 显存估算假设
\`\`\`
weight_mem ≈ params_b × bytes_per_param × 1.08
kv_mem     ≈ layers × kv_heads × head_dim × 2 × seq × batch × dtype_bytes × 1.2
\`\`\`
bytes_per_param：BF16 2 · FP8 1 · Q8 1.06 · Q6 0.8 · Q5 0.69 · Q4 0.58。有官方 / 社区文件大小时优先用实际值。MLA 按 576 维潜向量等效；混合线性注意力只对全注意力层计 KV；滑窗模型只计全局层。缺层数 / 头数 → 「KV 未建模」。

### 5.1 硬件配置与吞吐估算
\`\`\`
占用       = 权重(量化) + KV(上下文) + 1.2 GB × 卡数
解码 tok/s = 带宽 × 卡数 × eff ÷ (激活参数 × 每参数字节 + KV/token × 上下文)      eff：单卡 0.65 / 多卡 0.55 / 统一内存 0.5
预填充     = FP16 TFLOPS × 卡数 × 0.45 ÷ (2 × 激活参数)
\`\`\`
显卡规格在 \`data/hardware.json\`。「最低可跑」= 8K 上下文下最便宜的可行配置；「推荐」= 能以 ≥Q8/FP8 跑 32K 上下文且 ≥15 tok/s 的最便宜配置。MoE 解码只读激活参数，权重全部驻留显存。误差 ±30%，多卡 PCIe 环境再打折。

## 6. 「未披露」政策
闭源模型的参数量、层数、架构一律写「未披露」，不猜、不引用传闻。厂商官方明确说过的（如「稀疏 MoE」「超过 1T」）按原话写并注明。

## 7. 收录的基准
${list}

## 8. 更新与联系
数据更新 = 改仓库 JSON → 重新构建 → 部署。发现错误请在仓库提 issue / PR。
`
}

export default function Methodology() {
  const { t, lang } = useT()
  useSeo({ title: t('方法论'), description: t('综合参考分算法、开源 / 闭源分列规则、证据等级、显存与吞吐估算假设、未披露政策。'), path: '/methodology' })
  const md = buildMd(lang, t)
  return (
    <article className="max-w-3xl space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{t('方法论')}</h1>
      <p className="text-muted">{t('榜单没有方法论就没有信任。这里是全部规则，代码里的算法与本页一致。')}</p>
      <div className="md text-sm md:text-[15px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown></div>
      <p className="text-xs text-muted pt-4 border-t border-border">{t('排名供选型参考，基准会饱和、会泄漏、会过时。')}</p>
    </article>
  )
}
