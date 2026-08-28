export interface Topic { slug: string; title: string; summary: string; body: string }

export const TOPICS: Topic[] = [
  {
    slug: 'moe', title: 'Dense vs MoE：总参数 vs 激活参数',
    summary: 'MoE 模型「1T 总 / 32B 激活」意味着什么：显存按总参数算，算力按激活参数算。',
    body: `## 一句话
**Dense**：每个 token 经过全部参数。**MoE（Mixture of Experts）**：FFN 层被拆成 N 个「专家」，路由器为每个 token 只挑 k 个跑。

## 两个数字，两种成本
| | 决定什么 | 例子（Kimi K2） |
|---|---|---|
| 总参数 | **显存**：权重要全部驻留 | 1T → INT4 也要 594 GB |
| 激活参数 | **算力 / 延迟**：每 token 的 FLOPs | 32B → 解码速度接近 32B Dense |

所以「开源 1T 模型」并不意味着你能在家跑；「3B 激活」也不意味着它是 3B 模型（Qwen3-30B-A3B 权重仍要 18.6 GB Q4）。

## 常见设计参数
- **专家数 / 激活数**：DeepSeek-V3 256/8，Qwen3-235B 128/8，Qwen3-Next 512/10，gpt-oss 128/4。专家越多越细粒度，对推理引擎的专家并行要求越高。
- **共享专家**：DeepSeek / GLM / Kimi 有 1 个永远激活的共享专家，负责通用知识，路由专家负责专门化。Qwen3 系列没有。
- **路由方式**：top-k 门控 + 负载均衡损失（或 DeepSeek 的无辅助损失策略）。

## 对部署的影响
1. 显存按总参数准备，KV Cache 按层数与注意力配置准备。
2. 低并发时 MoE 的吞吐优势明显；高并发时专家负载不均会拖慢。
3. 量化：MoE 专家权重对 4-bit 相对友好（Kimi K2 直接以 INT4 QAT 发布）。
4. CPU offload 专家（如 KTransformers）可在单卡 + 大内存上跑 1T 模型，但速度只有几 tok/s。`,
  },
  {
    slug: 'attention', title: 'GQA / MHA / MLA：注意力与 KV 头',
    summary: 'KV 头数直接决定 KV Cache 大小；MLA 用低秩压缩把它再压一个量级。',
    body: `## MHA → GQA → MLA
- **MHA**（多头注意力）：每个 Query 头配一套 K/V。KV Cache = 层数 × 头数 × head_dim × 2。
- **GQA**（分组查询注意力）：多个 Query 头共用一组 K/V。Qwen3-32B 是 64 Q 头 / 8 KV 头，KV 直接砍到 1/8。绝大多数 2024–2025 开源模型用它。
- **MLA**（多头潜在注意力，DeepSeek）：把 K/V 压成一个低秩潜向量（DeepSeek-V3 是 512 维 + 64 维 RoPE），推理时再展开。每 token 每层只存 576 个数，比 GQA 8 头 × 128 = 2048 还小。

## 数字对比（每 token，BF16）
| 模型 | 注意力 | 每 token KV |
|---|---|---|
| Qwen3-32B | GQA 8 头 × 128 × 64 层 | 256 KiB |
| GLM-4.6 | GQA 8 头 × 128 × 92 层 | 368 KiB |
| DeepSeek-V3.2 | MLA 576 × 61 层 | ≈ 70 KiB |
| Qwen3-Next-80B | 混合，仅 12 层全注意力 | ≈ 24 KiB |

## 更新的变体
- **稀疏注意力（DSA）**：DeepSeek-V3.2 为每个 query 只挑 top-k 个键，把长上下文的注意力计算从 O(L²) 降到 O(L·k)。KV 仍要存，但算力大降。
- **滑动窗口**：Gemma 3 每 6 层只有 1 层看全局，其余 5 层只看 1024 token 窗口；gpt-oss 隔层滑窗 128。KV Cache 主要来自全局层。
- **线性 / 混合**：Qwen3-Next 的 Gated DeltaNet、Nemotron 3 的 Mamba-2。状态大小固定，不随序列增长，代价是精确的长程回忆变弱。

## 选型提示
KV 头数少 → 长上下文与高并发更省显存，但模型质量上限略受影响。看长上下文场景时，先看这个数，再看上下文标称长度。`,
  },
  {
    slug: 'kv-cache', title: 'KV Cache 与长上下文显存',
    summary: '上下文 128K 不是免费的：KV Cache 随 序列长度 × 并发 线性增长，经常比权重还大。',
    body: `## 公式
\`\`\`
kv_bytes ≈ layers × kv_heads × head_dim × 2 (K,V) × seq_len × batch × dtype_bytes
\`\`\`
以 Qwen3-32B（64 层 × 8 头 × 128 × 2 × 2 B = 256 KiB/token）为例：
- 8K 上下文单并发：2 GB
- 32K：8 GB
- 128K：32 GB —— **比 Q4 权重（19.8 GB）还大**
- 128K × 8 并发：256 GB，单卡不可能

## 为什么 24GB 卡跑 32B 模型总是 OOM
Q4 权重 19.8 GB 后只剩约 4 GB，够 16K 上下文单并发。标称 128K 只是「模型能理解」，不是「你的卡能装」。

## 降低 KV 的手段
1. **架构**：GQA 头数少、MLA、滑窗、线性注意力（见「注意力」篇）。
2. **KV 量化**：FP8 / INT8 KV 直接减半；llama.cpp 支持 q8_0 / q4_0 KV cache。
3. **PagedAttention**（vLLM）：按页分配，减少碎片，让并发共享前缀（prefix caching）。
4. **Prefix caching**：system prompt 相同的多请求只存一份。
5. **上下文截断 / 检索**：工程上最有效——别把 128K 塞满。

## 本站的估算
计算器用上式 × 1.2 碎片系数；缺层数 / 头数的模型标「KV 未建模」。闭源模型没有这个问题——它们按 token 收费，长上下文的代价体现在价格（>200K 常加价）。`,
  },
  {
    slug: 'quantization', title: '量化：BF16 / FP8 / Q8 / Q4 在部署上的意义',
    summary: '同一模型四种精度，显存差 4 倍，质量差异从「几乎无损」到「明显退化」。',
    body: `## 每参数字节数
| 精度 | bytes/param | 32B 模型权重 | 质量 |
|---|---|---|---|
| BF16 | 2 | 64 GB | 官方精度 |
| FP8 | 1 | 32 GB | 近无损（H100 原生加速） |
| Q8_0 | ≈ 1.06 | 34 GB | 近无损 |
| Q6_K | ≈ 0.8 | 26 GB | 轻微 |
| Q5_K_M | ≈ 0.69 | 22 GB | 轻微 |
| Q4_K_M | ≈ 0.58 | 19.8 GB | 可感知但通常可接受 |
| MXFP4 / INT4 QAT | ≈ 0.53 | — | 训练时感知，损失小 |

## 几个关键区分
- **训练后量化（PTQ）** vs **量化感知训练（QAT）**：Gemma 3 的 QAT 版、gpt-oss 的 MXFP4、Kimi K2 Thinking 的 INT4 都是训练阶段就考虑了低精度，比社区 GGUF 的 PTQ 质量更好。
- **权重量化 ≠ KV 量化**：Q4 只压权重，KV Cache 仍是 BF16，除非单独开 KV 量化。
- **MoE 的量化**：专家矩阵多、单个小，对 4-bit 相对友好；但路由与注意力层通常保留高精度（GGUF 的 K-quant 混合精度就是这么做的）。
- **小模型更怕量化**：8B 以下 Q4 退化比 70B Q4 明显。

## 本站的规则
- 显存表优先写官方 / 社区实际文件大小；没有的按上表系数估算并标「估」。
- 「单卡可跑」= 开源 + Q4 权重 × 1.1 ≤ 24 GB。这是能加载的门槛，不是舒适线。`,
  },
  {
    slug: 'thinking', title: 'Thinking / 推理模型与普通指令模型',
    summary: '推理模型先写一段思维链再回答；分数更高，但延迟、成本、过度思考都是代价。',
    body: `## 三种模式
| 模式 | 例子 | 行为 |
|---|---|---|
| 无思考 | Gemma 3、Kimi K2-0905、Llama 4 | 直接回答，最快 |
| 可开关 | Claude 4.5、Qwen3-32B、GLM-4.6、DeepSeek-V3.2 | 同一权重，按请求决定是否思考 |
| 默认开 / 不可关 | GPT-5、Qwen3-*-Thinking-2507、Kimi K2 Thinking | 总是先想 |

## 思考带来什么
- **考试型推理**（AIME、GPQA、HLE）大幅提升：Qwen3-32B 开思考后 AIME 从 ~20% 到 72.9%。
- **工程型推理**（SWE-bench、Terminal-bench）提升较温和，更依赖 agent 训练与工具使用。
- **成本**：思考 token 按输出计费。GPT-5 high effort 一条复杂请求可能产生 10K+ 隐藏 token。
- **延迟**：首 token 时间从几百毫秒变成几秒到几十秒。

## 常见坑
1. **过度思考**：Qwen3-235B-Thinking 对「1+1」也会写几百 token。简单任务用 Instruct 版或 effort=low。
2. **思维链不可见**（GPT-5、Gemini）：调试推理错误只能看摘要。
3. **交错思考**（Kimi K2 Thinking、MiniMax-M2、Claude）：思考与工具调用交替，多轮时必须回传历史思考内容，否则质量崩。
4. **蒸馏版**：小模型的思考能力往往是从大模型蒸馏的，考试分好看，泛化弱。

## 本站怎么标
详情顶栏的「推理模型」徽章 + 「可关」后缀；「训练与推理行为」节写默认状态与开关方式。`,
  },
  {
    slug: 'openness', title: '开源权重 vs 开放许可证 vs 可商用',
    summary: '「权重可下载」「OSI 开源」「可以商用」是三件不同的事，本站分别标注。',
    body: `## 三个独立维度
| 维度 | 问的是 | 本站字段 |
|---|---|---|
| 权重可下 | 能不能把模型文件下到自己机器 | \`weights_available\` → 徽章「开源 / 权重可下」 |
| 许可证 | 下载后能做什么 | \`license\` 逐字抄官方名 |
| 可商用 | 能不能拿去赚钱、有没有附加条件 | \`license_commercial\`：是 / 限制 / 否 |

## 常见许可证速查
- **MIT**（DeepSeek、GLM-4.5/4.6、MiniMax-M2）：几乎无限制。
- **Apache-2.0**（Qwen3、gpt-oss、Mistral Small、Devstral）：无限制 + 专利授权。
- **Modified MIT**（Kimi K2）：MIT + 大规模商用（月活 > 1 亿或月收入 > 2000 万美元）需在产品界面标注「Kimi K2」。本站标「限制许可」。
- **Llama 4 Community License**：月活 > 7 亿需向 Meta 申请；欧盟用户受限；本站标「限制许可」。
- **Gemma Terms of Use**：附带使用政策与下游传递义务；本站标「限制许可」。
- **NVIDIA Open Model License**：允许商用，有自己的条款。
- **Proprietary**：闭源，通过 API 使用，受服务条款约束。

## 本站的开源认定
进入「开源」榜必须同时满足：
1. 权重可下载（HF / 官方仓库）
2. 数据里 \`weights_available = true\`

仅 API（Qwen3-Max、Mistral Medium）或「承诺开源但未放权重」→ 闭源栏。

**开源榜与许可证无关**：Llama 4 在开源榜，但标「限制许可」；用户自己决定是否接受条款。

## 为什么不混为一谈
「Qwen3 开源」和「Llama 4 开源」在商用风险上完全不同；把它们都叫「开源免费商用」会让企业选型踩坑。`,
  },
]
