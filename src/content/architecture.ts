import type { Lang } from '@/i18n'

export interface Topic { slug: string; title: Record<Lang, string>; summary: Record<Lang, string>; body: Record<Lang, string> }

export const TOPICS: Topic[] = [
  {
    slug: 'moe',
    title: {
      zh: 'Dense vs MoE：总参数 vs 激活参数',
      en: 'Dense vs MoE: total vs active parameters',
      ja: 'Dense vs MoE：総パラメータ vs アクティブパラメータ',
    },
    summary: {
      zh: 'MoE 模型「1T 总 / 32B 激活」意味着什么：显存按总参数算，算力按激活参数算。',
      en: 'What "1T total / 32B active" means for an MoE model: VRAM follows total parameters, compute follows active ones.',
      ja: 'MoE の「総 1T / アクティブ 32B」の意味：VRAM は総パラメータ、計算量はアクティブパラメータで決まる。',
    },
    body: {
      zh: `## 一句话
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
      en: `## In one sentence
**Dense**: every token passes through all parameters. **MoE (Mixture of Experts)**: the FFN layer is split into N "experts", and a router picks only k of them for each token.

## Two numbers, two costs
| | Determines | Example (Kimi K2) |
|---|---|---|
| Total parameters | **VRAM**: all weights must stay resident | 1T → 594 GB even at INT4 |
| Active parameters | **Compute / latency**: FLOPs per token | 32B → decode speed close to a 32B Dense model |

So an "open-source 1T model" does not mean you can run it at home, and "3B active" does not make it a 3B model (Qwen3-30B-A3B still needs 18.6 GB of Q4 weights).

## Common design parameters
- **Experts / active experts**: DeepSeek-V3 256/8, Qwen3-235B 128/8, Qwen3-Next 512/10, gpt-oss 128/4. More experts means finer granularity and heavier expert-parallelism demands on the inference engine.
- **Shared expert**: DeepSeek / GLM / Kimi have one always-active shared expert for general knowledge, with routed experts handling specialization. The Qwen3 series has none.
- **Routing**: top-k gating + load-balancing loss (or DeepSeek's auxiliary-loss-free strategy).

## Impact on deployment
1. Provision VRAM by total parameters; provision KV Cache by layer count and attention configuration.
2. At low concurrency the MoE throughput advantage is clear; at high concurrency uneven expert load slows things down.
3. Quantization: MoE expert weights are relatively 4-bit friendly (Kimi K2 ships directly as INT4 QAT).
4. Offloading experts to CPU (e.g. KTransformers) lets a single GPU + lots of RAM run a 1T model, but only at a few tok/s.`,
      ja: `## 一言で
**Dense**：すべてのトークンが全パラメータを通る。**MoE（Mixture of Experts）**：FFN 層を N 個の「エキスパート」に分割し、ルーターがトークンごとに k 個だけ選んで実行する。

## 2 つの数字、2 種類のコスト
| | 決まるもの | 例（Kimi K2） |
|---|---|---|
| 総パラメータ | **VRAM**：重みは全部常駐が必要 | 1T → INT4 でも 594 GB |
| アクティブパラメータ | **計算量 / レイテンシ**：トークンあたり FLOPs | 32B → デコード速度は 32B Dense に近い |

したがって「オープンソースの 1T モデル」は自宅で動かせることを意味しないし、「アクティブ 3B」も 3B モデルであることを意味しない（Qwen3-30B-A3B の重みは Q4 でも 18.6 GB 必要）。

## よくある設計パラメータ
- **エキスパート数 / アクティブ数**：DeepSeek-V3 256/8、Qwen3-235B 128/8、Qwen3-Next 512/10、gpt-oss 128/4。エキスパートが多いほど粒度が細かく、推論エンジンのエキスパート並列への要求が高くなる。
- **共有エキスパート**：DeepSeek / GLM / Kimi には常時アクティブな共有エキスパートが 1 つあり、汎用知識を担当、ルーティングされるエキスパートが専門化を担当する。Qwen3 系にはない。
- **ルーティング方式**：top-k ゲーティング + 負荷分散損失（または DeepSeek の補助損失なし戦略）。

## デプロイへの影響
1. VRAM は総パラメータで、KV Cache は層数とアテンション構成で見積もる。
2. 低並列時は MoE のスループット優位が明確。高並列時はエキスパートの負荷偏りが足を引っ張る。
3. 量子化：MoE のエキスパート重みは 4-bit に比較的向いている（Kimi K2 は INT4 QAT でそのまま公開）。
4. エキスパートの CPU オフロード（KTransformers など）で単一 GPU + 大容量メモリでも 1T モデルを動かせるが、速度は数 tok/s 程度。`,
    },
  },
  {
    slug: 'attention',
    title: {
      zh: 'GQA / MHA / MLA：注意力与 KV 头',
      en: 'GQA / MHA / MLA: attention and KV heads',
      ja: 'GQA / MHA / MLA：アテンションと KV ヘッド',
    },
    summary: {
      zh: 'KV 头数直接决定 KV Cache 大小；MLA 用低秩压缩把它再压一个量级。',
      en: 'The number of KV heads directly sets KV Cache size; MLA squeezes it another order of magnitude with low-rank compression.',
      ja: 'KV ヘッド数が KV Cache のサイズを直接決める。MLA は低ランク圧縮でさらに一桁小さくする。',
    },
    body: {
      zh: `## MHA → GQA → MLA
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
      en: `## MHA → GQA → MLA
- **MHA** (Multi-Head Attention): every Query head gets its own K/V. KV Cache = layers × heads × head_dim × 2.
- **GQA** (Grouped-Query Attention): several Query heads share one K/V group. Qwen3-32B has 64 Q heads / 8 KV heads, cutting KV straight to 1/8. Almost every 2024–2025 open-weight model uses it.
- **MLA** (Multi-head Latent Attention, DeepSeek): compresses K/V into a low-rank latent vector (DeepSeek-V3: 512 dims + 64 RoPE dims) and expands it at inference time. Only 576 numbers per token per layer, smaller than GQA's 8 heads × 128 = 2048.

## Numbers side by side (per token, BF16)
| Model | Attention | KV per token |
|---|---|---|
| Qwen3-32B | GQA 8 heads × 128 × 64 layers | 256 KiB |
| GLM-4.6 | GQA 8 heads × 128 × 92 layers | 368 KiB |
| DeepSeek-V3.2 | MLA 576 × 61 layers | ≈ 70 KiB |
| Qwen3-Next-80B | Hybrid, only 12 full-attention layers | ≈ 24 KiB |

## Newer variants
- **Sparse attention (DSA)**: DeepSeek-V3.2 selects only the top-k keys for each query, reducing long-context attention compute from O(L²) to O(L·k). KV still has to be stored, but compute drops sharply.
- **Sliding window**: in Gemma 3 only 1 of every 6 layers sees the full context, the other 5 see a 1024-token window; gpt-oss alternates layers with a 128-token window. KV Cache comes mostly from the global layers.
- **Linear / hybrid**: Qwen3-Next's Gated DeltaNet, Nemotron 3's Mamba-2. State size is fixed and does not grow with sequence length; the price is weaker precise long-range recall.

## Selection tip
Fewer KV heads → less VRAM for long contexts and high concurrency, at a slight cost to the model's quality ceiling. For long-context scenarios, look at this number first, then at the advertised context length.`,
      ja: `## MHA → GQA → MLA
- **MHA**（Multi-Head Attention）：Query ヘッドごとに K/V を一組持つ。KV Cache = 層数 × ヘッド数 × head_dim × 2。
- **GQA**（Grouped-Query Attention）：複数の Query ヘッドが 1 組の K/V を共有する。Qwen3-32B は 64 Q ヘッド / 8 KV ヘッドで、KV は一気に 1/8 になる。2024–2025 年のオープンモデルの大半が採用。
- **MLA**（Multi-head Latent Attention、DeepSeek）：K/V を低ランクの潜在ベクトルに圧縮し（DeepSeek-V3 は 512 次元 + 64 次元 RoPE）、推論時に展開する。トークン・層あたり 576 個の数値しか保存せず、GQA の 8 ヘッド × 128 = 2048 より小さい。

## 数字で比較（トークンあたり、BF16）
| モデル | アテンション | トークンあたり KV |
|---|---|---|
| Qwen3-32B | GQA 8 ヘッド × 128 × 64 層 | 256 KiB |
| GLM-4.6 | GQA 8 ヘッド × 128 × 92 層 | 368 KiB |
| DeepSeek-V3.2 | MLA 576 × 61 層 | ≈ 70 KiB |
| Qwen3-Next-80B | ハイブリッド、フルアテンションは 12 層のみ | ≈ 24 KiB |

## 新しい派生
- **スパースアテンション（DSA）**：DeepSeek-V3.2 は query ごとに top-k 個のキーだけを選び、長文脈のアテンション計算を O(L²) から O(L·k) に下げる。KV の保存は依然必要だが、計算量は大幅に減る。
- **スライディングウィンドウ**：Gemma 3 は 6 層に 1 層だけが全体を見て、残り 5 層は 1024 トークンの窓しか見ない。gpt-oss は 1 層おきに 128 の窓。KV Cache は主にグローバル層から来る。
- **線形 / ハイブリッド**：Qwen3-Next の Gated DeltaNet、Nemotron 3 の Mamba-2。状態サイズが固定で系列長に比例して増えない。代償は正確な長距離の想起が弱くなること。

## 選定のヒント
KV ヘッドが少ない → 長文脈・高並列で VRAM を節約できるが、モデル品質の上限にわずかに影響する。長文脈用途ではまずこの数字を見て、次に公称コンテキスト長を見る。`,
    },
  },
  {
    slug: 'kv-cache',
    title: {
      zh: 'KV Cache 与长上下文显存',
      en: 'KV Cache and long-context VRAM',
      ja: 'KV Cache と長文脈の VRAM',
    },
    summary: {
      zh: '上下文 128K 不是免费的：KV Cache 随 序列长度 × 并发 线性增长，经常比权重还大。',
      en: 'A 128K context is not free: KV Cache grows linearly with sequence length × concurrency and is often larger than the weights.',
      ja: '128K コンテキストは無料ではない：KV Cache は 系列長 × 並列数 に比例して増え、重みより大きくなることも多い。',
    },
    body: {
      zh: `## 公式
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
      en: `## Formula
\`\`\`
kv_bytes ≈ layers × kv_heads × head_dim × 2 (K,V) × seq_len × batch × dtype_bytes
\`\`\`
Take Qwen3-32B (64 layers × 8 heads × 128 × 2 × 2 B = 256 KiB/token):
- 8K context, single request: 2 GB
- 32K: 8 GB
- 128K: 32 GB — **larger than the Q4 weights (19.8 GB)**
- 128K × 8 concurrent: 256 GB, impossible on one GPU

## Why a 24 GB card keeps OOMing on a 32B model
After 19.8 GB of Q4 weights only about 4 GB is left, enough for a 16K context with a single request. The advertised 128K only means "the model can understand it", not "your card can hold it".

## Ways to shrink KV
1. **Architecture**: fewer GQA heads, MLA, sliding window, linear attention (see the "Attention" page).
2. **KV quantization**: FP8 / INT8 KV halves it outright; llama.cpp supports q8_0 / q4_0 KV cache.
3. **PagedAttention** (vLLM): page-based allocation reduces fragmentation and lets concurrent requests share prefixes (prefix caching).
4. **Prefix caching**: requests with the same system prompt store it only once.
5. **Context truncation / retrieval**: the most effective engineering fix — don't fill all 128K.

## How this site estimates
The calculator uses the formula above × 1.2 fragmentation factor; models missing layer / head counts are marked "KV not modeled". Closed models don't have this problem — they charge per token, and the cost of long context shows up in the price (>200K often costs extra).`,
      ja: `## 式
\`\`\`
kv_bytes ≈ layers × kv_heads × head_dim × 2 (K,V) × seq_len × batch × dtype_bytes
\`\`\`
Qwen3-32B（64 層 × 8 ヘッド × 128 × 2 × 2 B = 256 KiB/token）を例にすると：
- 8K コンテキスト・単一リクエスト：2 GB
- 32K：8 GB
- 128K：32 GB —— **Q4 の重み（19.8 GB）より大きい**
- 128K × 8 並列：256 GB、単一 GPU では不可能

## なぜ 24GB の GPU で 32B モデルがいつも OOM になるのか
Q4 の重み 19.8 GB の後に残るのは約 4 GB で、単一リクエストなら 16K コンテキスト分。公称 128K は「モデルが理解できる」であって「あなたの GPU に収まる」ではない。

## KV を減らす手段
1. **アーキテクチャ**：GQA ヘッド数の削減、MLA、スライディングウィンドウ、線形アテンション（「アテンション」の項を参照）。
2. **KV 量子化**：FP8 / INT8 KV でそのまま半減。llama.cpp は q8_0 / q4_0 の KV cache に対応。
3. **PagedAttention**（vLLM）：ページ単位で割り当ててフラグメントを減らし、並列リクエスト間でプレフィックスを共有（prefix caching）。
4. **Prefix caching**：同じ system prompt を持つ複数リクエストは 1 つだけ保存。
5. **コンテキストの切り詰め / 検索**：エンジニアリング上もっとも効果的——128K を満杯にしない。

## 本サイトの見積もり
計算機は上の式 × 1.2 のフラグメント係数を使う。層数 / ヘッド数が不明なモデルは「KV 未モデル化」と表示。クローズドモデルにはこの問題はない——トークン課金であり、長文脈のコストは価格に現れる（>200K で割増になることが多い）。`,
    },
  },
  {
    slug: 'quantization',
    title: {
      zh: '量化：BF16 / FP8 / Q8 / Q4 在部署上的意义',
      en: 'Quantization: what BF16 / FP8 / Q8 / Q4 mean for deployment',
      ja: '量子化：BF16 / FP8 / Q8 / Q4 がデプロイで意味すること',
    },
    summary: {
      zh: '同一模型四种精度，显存差 4 倍，质量差异从「几乎无损」到「明显退化」。',
      en: 'The same model at four precisions: a 4× spread in VRAM, and quality ranging from "nearly lossless" to "noticeably degraded".',
      ja: '同じモデルでも 4 種類の精度で VRAM は 4 倍違い、品質は「ほぼ無損失」から「明確な劣化」まで幅がある。',
    },
    body: {
      zh: `## 每参数字节数
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
      en: `## Bytes per parameter
| Precision | bytes/param | Weights of a 32B model | Quality |
|---|---|---|---|
| BF16 | 2 | 64 GB | Official precision |
| FP8 | 1 | 32 GB | Near lossless (native acceleration on H100) |
| Q8_0 | ≈ 1.06 | 34 GB | Near lossless |
| Q6_K | ≈ 0.8 | 26 GB | Slight |
| Q5_K_M | ≈ 0.69 | 22 GB | Slight |
| Q4_K_M | ≈ 0.58 | 19.8 GB | Perceptible but usually acceptable |
| MXFP4 / INT4 QAT | ≈ 0.53 | — | Quantization-aware at training time, small loss |

## Key distinctions
- **Post-training quantization (PTQ)** vs **quantization-aware training (QAT)**: Gemma 3's QAT release, gpt-oss's MXFP4 and Kimi K2 Thinking's INT4 all account for low precision during training, and are better quality than community GGUF PTQ.
- **Weight quantization ≠ KV quantization**: Q4 only compresses weights; the KV Cache stays BF16 unless KV quantization is enabled separately.
- **Quantizing MoE**: many small expert matrices are relatively 4-bit friendly, but routing and attention layers usually keep higher precision (GGUF's mixed-precision K-quants do exactly this).
- **Small models suffer more**: Q4 degradation below 8B is more visible than Q4 on a 70B model.

## Rules on this site
- The VRAM table prefers actual official / community file sizes; otherwise it estimates with the factors above and marks "est.".
- "Runs on one GPU" = open weights + Q4 weights × 1.1 ≤ 24 GB. This is the threshold for loading, not a comfort line.`,
      ja: `## パラメータあたりのバイト数
| 精度 | bytes/param | 32B モデルの重み | 品質 |
|---|---|---|---|
| BF16 | 2 | 64 GB | 公式精度 |
| FP8 | 1 | 32 GB | ほぼ無損失（H100 でネイティブ高速化） |
| Q8_0 | ≈ 1.06 | 34 GB | ほぼ無損失 |
| Q6_K | ≈ 0.8 | 26 GB | わずか |
| Q5_K_M | ≈ 0.69 | 22 GB | わずか |
| Q4_K_M | ≈ 0.58 | 19.8 GB | 体感できるが通常は許容範囲 |
| MXFP4 / INT4 QAT | ≈ 0.53 | — | 学習時に量子化を考慮、損失は小さい |

## 重要な区別
- **学習後量子化（PTQ）** vs **量子化認識学習（QAT）**：Gemma 3 の QAT 版、gpt-oss の MXFP4、Kimi K2 Thinking の INT4 はいずれも学習段階から低精度を考慮しており、コミュニティ GGUF の PTQ より品質が良い。
- **重みの量子化 ≠ KV の量子化**：Q4 は重みだけを圧縮する。KV 量子化を別途有効にしない限り KV Cache は BF16 のまま。
- **MoE の量子化**：エキスパート行列は数が多く個々は小さいため 4-bit に比較的向いている。ただしルーティングとアテンション層は通常高精度を維持する（GGUF の K-quant の混合精度がまさにそれ）。
- **小さいモデルほど量子化に弱い**：8B 以下の Q4 の劣化は 70B の Q4 より目立つ。

## 本サイトのルール
- VRAM 表は公式 / コミュニティの実ファイルサイズを優先。ない場合は上表の係数で見積もり「推定」と表示。
- 「単一 GPU で動く」= オープンウェイト + Q4 重み × 1.1 ≤ 24 GB。これはロードできる下限であり、快適ラインではない。`,
    },
  },
  {
    slug: 'thinking',
    title: {
      zh: 'Thinking / 推理模型与普通指令模型',
      en: 'Thinking / reasoning models vs plain instruct models',
      ja: 'Thinking / 推論モデルと通常の指示モデル',
    },
    summary: {
      zh: '推理模型先写一段思维链再回答；分数更高，但延迟、成本、过度思考都是代价。',
      en: 'Reasoning models write a chain of thought before answering; scores go up, but latency, cost and overthinking are the price.',
      ja: '推論モデルは思考の連鎖を書いてから回答する。スコアは上がるが、レイテンシ・コスト・考えすぎが代償。',
    },
    body: {
      zh: `## 三种模式
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
      en: `## Three modes
| Mode | Examples | Behavior |
|---|---|---|
| No thinking | Gemma 3, Kimi K2-0905, Llama 4 | Answers directly, fastest |
| Switchable | Claude 4.5, Qwen3-32B, GLM-4.6, DeepSeek-V3.2 | Same weights, thinking decided per request |
| On by default / cannot be disabled | GPT-5, Qwen3-*-Thinking-2507, Kimi K2 Thinking | Always thinks first |

## What thinking buys you
- **Exam-style reasoning** (AIME, GPQA, HLE) improves dramatically: Qwen3-32B goes from ~20% to 72.9% on AIME with thinking on.
- **Engineering-style reasoning** (SWE-bench, Terminal-bench) improves more modestly and depends more on agent training and tool use.
- **Cost**: thinking tokens are billed as output. A complex GPT-5 high-effort request can produce 10K+ hidden tokens.
- **Latency**: time to first token goes from hundreds of milliseconds to seconds or tens of seconds.

## Common pitfalls
1. **Overthinking**: Qwen3-235B-Thinking writes hundreds of tokens even for "1+1". Use the Instruct variant or effort=low for simple tasks.
2. **Hidden chain of thought** (GPT-5, Gemini): debugging reasoning errors only gives you a summary.
3. **Interleaved thinking** (Kimi K2 Thinking, MiniMax-M2, Claude): thinking alternates with tool calls; in multi-turn use you must pass previous thinking content back, or quality collapses.
4. **Distilled variants**: small models' thinking ability is often distilled from larger ones — good exam scores, weak generalization.

## How this site labels it
The "Reasoning model" badge in the detail header + a "switchable" suffix; the "Training and inference behavior" section describes the default state and how to toggle it.`,
      ja: `## 3 つのモード
| モード | 例 | 挙動 |
|---|---|---|
| 思考なし | Gemma 3、Kimi K2-0905、Llama 4 | 直接回答、最速 |
| 切替可能 | Claude 4.5、Qwen3-32B、GLM-4.6、DeepSeek-V3.2 | 同じ重みで、リクエストごとに思考するか決める |
| デフォルト有効 / 無効化不可 | GPT-5、Qwen3-*-Thinking-2507、Kimi K2 Thinking | 常に先に考える |

## 思考がもたらすもの
- **試験型の推論**（AIME、GPQA、HLE）が大幅に向上：Qwen3-32B は思考を有効にすると AIME が ~20% から 72.9% に。
- **エンジニアリング型の推論**（SWE-bench、Terminal-bench）の向上は穏やかで、エージェント学習とツール利用への依存が大きい。
- **コスト**：思考トークンは出力として課金される。GPT-5 の high effort では複雑なリクエスト 1 件で 10K+ の隠れトークンが生じうる。
- **レイテンシ**：最初のトークンまでの時間が数百ミリ秒から数秒〜数十秒に。

## よくある落とし穴
1. **考えすぎ**：Qwen3-235B-Thinking は「1+1」にも数百トークン書く。簡単なタスクには Instruct 版か effort=low を使う。
2. **思考の連鎖が見えない**（GPT-5、Gemini）：推論エラーのデバッグは要約しか見られない。
3. **交互思考**（Kimi K2 Thinking、MiniMax-M2、Claude）：思考とツール呼び出しが交互に行われ、マルチターンでは過去の思考内容を返さないと品質が崩壊する。
4. **蒸留版**：小型モデルの思考能力は大型モデルから蒸留されたものが多く、試験スコアは良く見えるが汎化は弱い。

## 本サイトでの表示
詳細ページ上部の「推論モデル」バッジ + 「切替可」サフィックス。「学習と推論の挙動」節にデフォルト状態と切り替え方法を記載。`,
    },
  },
  {
    slug: 'openness',
    title: {
      zh: '开源权重 vs 开放许可证 vs 可商用',
      en: 'Open weights vs open license vs commercial use',
      ja: 'オープンウェイト vs オープンライセンス vs 商用利用可',
    },
    summary: {
      zh: '「权重可下载」「OSI 开源」「可以商用」是三件不同的事，本站分别标注。',
      en: '"Weights downloadable", "OSI open source" and "commercial use allowed" are three different things; this site labels each separately.',
      ja: '「重みをダウンロードできる」「OSI オープンソース」「商用利用できる」は別のこと。本サイトはそれぞれ個別に表示する。',
    },
    body: {
      zh: `## 三个独立维度
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
      en: `## Three independent dimensions
| Dimension | The question | Field on this site |
|---|---|---|
| Weights downloadable | Can you get the model files onto your own machine? | \`weights_available\` → badge "Open / weights available" |
| License | What can you do after downloading? | \`license\`, copied verbatim from the official name |
| Commercial use | Can you make money with it, and with what conditions? | \`license_commercial\`: yes / restricted / no |

## Quick reference for common licenses
- **MIT** (DeepSeek, GLM-4.5/4.6, MiniMax-M2): almost no restrictions.
- **Apache-2.0** (Qwen3, gpt-oss, Mistral Small, Devstral): no restrictions + patent grant.
- **Modified MIT** (Kimi K2): MIT + large-scale commercial use (>100M MAU or >$20M monthly revenue) must display "Kimi K2" in the product UI. Labeled "restricted license" here.
- **Llama 4 Community License**: >700M MAU requires a request to Meta; EU users are restricted; labeled "restricted license" here.
- **Gemma Terms of Use**: comes with a use policy and pass-through obligations for downstream users; labeled "restricted license" here.
- **NVIDIA Open Model License**: allows commercial use, with its own terms.
- **Proprietary**: closed, used via API, governed by terms of service.

## How this site decides "open"
To enter the "Open" leaderboard a model must satisfy both:
1. Weights downloadable (HF / official repo)
2. \`weights_available = true\` in the data

API-only (Qwen3-Max, Mistral Medium) or "promised open but weights not released" → closed column.

**The open leaderboard is independent of license**: Llama 4 is on the open leaderboard but labeled "restricted license"; users decide for themselves whether to accept the terms.

## Why not lump them together
"Qwen3 is open" and "Llama 4 is open" carry completely different commercial risk; calling both "open, free for commercial use" leads enterprises into traps when selecting models.`,
      ja: `## 3 つの独立した軸
| 軸 | 問うこと | 本サイトのフィールド |
|---|---|---|
| 重みをダウンロード可 | モデルファイルを自分のマシンに落とせるか | \`weights_available\` → バッジ「オープン / 重み入手可」 |
| ライセンス | ダウンロード後に何ができるか | \`license\` は公式名をそのまま転記 |
| 商用利用可 | 収益化できるか、付帯条件はあるか | \`license_commercial\`：可 / 制限あり / 不可 |

## よくあるライセンス早見表
- **MIT**（DeepSeek、GLM-4.5/4.6、MiniMax-M2）：ほぼ制限なし。
- **Apache-2.0**（Qwen3、gpt-oss、Mistral Small、Devstral）：制限なし + 特許許諾。
- **Modified MIT**（Kimi K2）：MIT + 大規模商用（MAU 1 億超または月間売上 2000 万ドル超）では製品 UI に「Kimi K2」の表示が必要。本サイトでは「制限付きライセンス」と表示。
- **Llama 4 Community License**：MAU 7 億超は Meta への申請が必要。EU ユーザーには制限あり。本サイトでは「制限付きライセンス」と表示。
- **Gemma Terms of Use**：利用ポリシーと下流への伝達義務が付帯。本サイトでは「制限付きライセンス」と表示。
- **NVIDIA Open Model License**：商用利用可、独自の条項あり。
- **Proprietary**：クローズド、API 経由で利用、利用規約に拘束される。

## 本サイトのオープン認定
「オープン」ランキングに入るには以下を両方満たす必要がある：
1. 重みがダウンロード可能（HF / 公式リポジトリ）
2. データ上 \`weights_available = true\`

API のみ（Qwen3-Max、Mistral Medium）や「オープン化を約束したが重み未公開」→ クローズド欄。

**オープンランキングはライセンスとは無関係**：Llama 4 はオープンランキングに載るが「制限付きライセンス」と表示。条項を受け入れるかはユーザー自身が判断する。

## なぜ一緒くたにしないのか
「Qwen3 はオープン」と「Llama 4 はオープン」では商用リスクがまったく異なる。両方を「オープンで商用無料」と呼ぶと、企業の選定で落とし穴にはまる。`,
    },
  },
]
