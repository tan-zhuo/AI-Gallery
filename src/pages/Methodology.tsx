import { useSeo } from '@/hooks/useSeo'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { meta, benchmarks } from '@/lib/catalog'
import { DEFAULT_WEIGHTS } from '@/lib/scoring'

const md = `
## 1. 数据来源与截止日期
- 本站**没有自动抓取**。所有分数、价格、规格都是仓库里的静态文件（\`data/models/*.json\`、\`data/scores.json\`），由维护者手工更新后重新构建。
- 每条分数带 \`source\`、\`source_url\`、\`as_of\`、\`evidence\`。页面上任何数字都能追溯到这四项，或明确标「估计」/「未披露」。
- 当前快照数据截止 **${meta.data_cutoff}**，站点构建于 **${meta.generated_at}**。

${meta.note ? `> ${meta.note}` : ''}

## 2. 综合参考分怎么算
「综合参考分」只是**默认排序键**，不是真理。榜单同时展示 Arena Elo、AA 指数、代码、推理等原始分，详情页列出全部来源。

\`\`\`
score = ${Object.entries(DEFAULT_WEIGHTS).map(([k, w]) => `${w!.toFixed(2)} × norm(${k})`).join('\n      + ')}

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
${benchmarks.map((b) => `- **${b.name}**（${b.name_zh ?? ''}，${b.category}）${b.description ? '：' + b.description : ''}`).join('\n')}

## 8. 更新与联系
数据更新 = 改仓库 JSON → 重新构建 → 部署。发现错误请在仓库提 issue / PR。
`

export default function Methodology() {
  useSeo({ title: '方法论', description: '综合参考分算法、开源 / 闭源分列规则、证据等级、显存与吞吐估算假设、未披露政策。', path: '/methodology' })
  return (
    <article className="max-w-3xl space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">方法论</h1>
      <p className="text-muted">榜单没有方法论就没有信任。这里是全部规则，代码里的算法与本页一致。</p>
      <div className="md text-sm md:text-[15px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown></div>
      <p className="text-xs text-muted pt-4 border-t border-border">排名供选型参考，基准会饱和、会泄漏、会过时。</p>
    </article>
  )
}
