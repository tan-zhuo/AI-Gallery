export const en_b: Record<string, string> = {
  // Models
  '按开闭源、厂商、体量、许可证、硬件筛选 {n} 个 AI 模型，含发布日期、参数、上下文、价格与 Q4 显存。': 'Filter {n} AI models by openness, vendor, size, license and hardware, with release date, parameters, context, price and Q4 VRAM.',
  '{a} / {b} 个模型': '{a} / {b} models', '排序': 'Sort', '参考分': 'Ref. score', '发布日期': 'Release date', '更新日期': 'Updated', '参数量': 'Parameters', '价格': 'Price', '名称': 'Name',
  '搜索…': 'Search…', '开放性': 'Openness', '全部': 'All', '厂商': 'Vendor', '体量（总参数）': 'Size (total params)', '许可证': 'License', '限制性': 'Restricted', '模态': 'Modality', '视觉': 'Vision', '工具调用': 'Tool use',
  '硬件（开源 Q4）': 'Hardware (open, Q4)', '能进 {g}GB': 'Fits {g}GB', '推理': 'Reasoning', '推理模型 (thinking)': 'Reasoning (thinking)', '代际': 'Generation', '包含已被替代的旧代': 'Include superseded models', '清空筛选': 'Clear filters', '没有匹配的模型': 'No matching models',
  '模型': 'Model', '开闭源': 'Openness', '发布': 'Released', '参数': 'Params', '上下文': 'Context', '完整说明书': 'Full sheet', '速览': 'Brief',
  '「速览」模型只有顶栏、分数与链接，说明书缺节显示「完善中」。': '"Brief" models only have the header, scores and links; missing sheet sections show "In progress".', '如何贡献': 'How to contribute',
  // ModelDetail
  '未找到模型「{slug}」': 'Model "{slug}" not found', '去模型库': 'Go to models',
  '{name}（{vendor}）说明书：{one} 参数 {params}，上下文 {ctx}，价格 {price}，架构、显存、显卡配置与评测分数。': '{name} ({vendor}) sheet: {one} Params {params}, context {ctx}, price {price}, plus architecture, VRAM, GPU configs and benchmark scores.',
  '技术报告': 'Tech report', '官方': 'Official', '官方模型页': 'Official page', '定价': 'Pricing', '发布公告': 'Announcement',
  '当前代': 'Current', '已停更': 'Deprecated', '输出 {n}K': 'Output {n}K', '价格 / 1M tok': 'Price / 1M tok', '无官方 API': 'No official API', '最低可跑': 'Minimum setup', 'API 速度': 'API speed', '多节点': 'Multi-node', '超出单机': 'Beyond one machine', '首 token {s}s': 'First token {s}s', '无自建选项': 'No self-host option',
  'AA 综合指数': 'AA Index', '代码': 'Code', 'GPQA 推理': 'GPQA reasoning', '已在对比中 ✓': 'In compare ✓', '加入对比': 'Add to compare', '去对比（{n}）→': 'Compare ({n}) →', '架构简图': 'Architecture sketch',
  '架构': 'Architecture', '参数与内存': 'Params & memory', '能力画像': 'Capabilities', '训练与推理行为': 'Training & inference', '亮点与坑': 'Highlights & pitfalls', '生态与部署': 'Ecosystem & deployment', '证据与榜单明细': 'Evidence & scores', '版本与家族': 'Versions & family',
  '综合参考分': 'Reference score', '部分数据': 'Partial data', '算法': 'Method',
  '类型': 'Type', 'Hybrid（线性 + 全注意力）': 'Hybrid (linear + full attention)', '注意力': 'Attention', '层数': 'Layers', '专家': 'Experts', '{n} · 激活 {m}': '{n} · {m} active', '+ 共享': '+ shared', '隐藏维': 'Hidden size', '词表': 'Vocab',
  '精度': 'Precision', '权重大小': 'Weight size', '说明': 'Note', 'GGUF Q4_K_M 或等效': 'GGUF Q4_K_M or equivalent', '官方精度': 'Official precision', '消费级 24GB': 'Consumer 24GB', '单卡 80GB': 'Single 80GB', '8×80GB 节点': '8×80GB node', '未评估': 'Not assessed', 'KV Cache：': 'KV cache: ',
  '⚠ 能加载 ≠ 能在满上下文 / 高并发下舒服跑。标「估」的数字来自': '⚠ Loading ≠ running comfortably at full context / high concurrency. Numbers marked "est." come from the', '公式或社区量化文件大小。': 'formula or community quant file sizes.',
  '硬件配置与预估吞吐': 'Hardware configs & estimated throughput', '用计算器按你的上下文与并发估算 →': 'Estimate for your context and batch in the calculator →', '闭源模型，无自建选项，不提供显存表。': 'Closed model, no self-hosting; no VRAM table.',
  '编程': 'Coding', '数学': 'Math', '知识': 'Knowledge', '指令遵循': 'Instruction', '中文': 'Chinese', '逻辑能力': 'Logical ability',
  '默认思考': 'Thinking default', '无思考模式': 'No thinking mode', '可开关': 'Toggleable', '默认开启': 'On by default', '支持': 'Supported', '计算机使用': 'Computer use', '最大输出': 'Max output',
  '亮点': 'Highlights', '坑': 'Pitfalls', '适合：': 'Good for: ', '不适合：': 'Not for: ',
  '推理引擎': 'Inference engines', '官方 API': 'Official API', '微调': 'Fine-tuning', '不支持': 'Not supported', '中文文档': 'Chinese docs', '论文 / 报告': 'Paper / report',
  '暂无带来源的分数。': 'No sourced scores yet.', '基准': 'Benchmark', '分数': 'Score', '来源': 'Source', '日期': 'Date', '证据': 'Evidence', '更新': 'Updated',
  // DeploySection
  '在本站硬件表内无可行配置（需多节点或权重未知）': 'No feasible config in our hardware table (needs multi-node or weights unknown)', '合计': 'total', '量化': 'Quant', '解码': 'Decode', '最大上下文': 'Max context', '未建模': 'Not modeled',
  '闭源模型无自建选项；吞吐取决于官方 API。': 'Closed model, no self-hosting; throughput depends on the official API.', '参数量未知或超出本站硬件表（> 8×B200），无法给出配置。': 'Parameter count unknown or beyond our hardware table (> 8×B200); no config available.',
  '最低可跑（8K 上下文）': 'Minimum (8K context)', '推荐配置（≥Q8 · 32K 上下文 · ≥15 tok/s）': 'Recommended (≥Q8 · 32K context · ≥15 tok/s)', '配置': 'Config', '占用 / 显存': 'Used / VRAM', '解码 tok/s': 'Decode tok/s', '预填充 tok/s': 'Prefill tok/s',
  '单流（batch=1）估算：解码 ≈ 显存带宽 × 效率 ÷ 每 token 读取字节（激活参数 × 量化位宽 + KV）；预填充 ≈ FP16 算力 × 0.45 ÷ (2 × 激活参数)。多卡按张量并行、带宽求和 × 0.55。实际受引擎、驱动、PCIe 影响，误差 ±30%。': 'Single-stream (batch=1) estimate: decode ≈ memory bandwidth × efficiency ÷ bytes read per token (active params × quant bits + KV); prefill ≈ FP16 TFLOPS × 0.45 ÷ (2 × active params). Multi-GPU assumes tensor parallel, summed bandwidth × 0.55. Real results vary with engine, driver and PCIe; ±30% error.',
  '反向查：我的卡能跑谁 →': 'Reverse lookup: what can my GPU run →',
  // ArchDiagram
  '{name} 架构简图': '{name} architecture sketch', '词表 {n}': 'Vocab {n}', '× {n} 层': '× {n} layers', '（{n} 层全注意力）': ' ({n} full-attention layers)', '注意力（未披露）': 'Attention (undisclosed)', '注意力：{x}': 'Attention: {x}', 'KV 头 {n} · head_dim {d}': 'KV heads {n} · head_dim {d}',
  '路由': 'Router', '共享专家': 'Shared expert', '{n} 专家 · 激活 {m}': '{n} experts · {m} active', '专家数未披露': 'Expert count undisclosed', 'FFN / MoE（未披露）': 'FFN / MoE (undisclosed)', '隐藏维 {n}': 'Hidden {n}', '厂商未公开内部结构': 'Internals not disclosed by vendor', 'Dense：每个 token 经过全部参数': 'Dense: every token passes through all params', '/ {a} 激活': '/ {a} active', '参数未披露': 'Params undisclosed', '实线 = 已公开 · 虚线 = 未披露': 'Solid = disclosed · dashed = undisclosed',
  // Compare
  '对比：{names}': 'Compare: {names}', '模型对比台': 'Model comparison', '并排对比最多 4 个 AI 模型：许可证、参数、架构、上下文、显存、价格与评测分数。': 'Compare up to 4 AI models side by side: license, params, architecture, context, VRAM, price and benchmark scores.',
  '对比台': 'Compare', '最多 {n} 个。选择状态只存在 URL 里，复制即可分享。': 'Up to {n}. Selection lives only in the URL; copy it to share.', '已复制': 'Copied', '复制分享链接': 'Copy share link', '清空': 'Clear', '添加模型…': 'Add model…', '添加模型': 'Add model',
  '从榜单勾选模型，或在上方搜索添加。': 'Pick models from the leaderboard or search above.', '去排行榜': 'Go to leaderboard', '维度': 'Dimension', '移除': 'Remove',
  '身份与许可': 'Identity & license', '权重': 'Weights', '可下载': 'Downloadable', '状态': 'Status', '体量与架构': 'Size & architecture', '推理模式': 'Reasoning mode', '无': 'None', '默认开': 'Default on', '文本': 'Text',
  '显存与价格': 'VRAM & price', 'BF16 权重': 'BF16 weights', 'Q4 权重': 'Q4 weights', '单卡 24GB': 'Single 24GB', '可跑': 'Runs', '不可': 'No', '价格 in / out': 'Price in / out', '适合 / 不适合': 'Good for / not for', '适合': 'Good for', '不适合': 'Not for', '外链': 'Links', '链接': 'Links', '论文': 'Paper',
  '能力雷达（基准原始值；Elo 按 1200–1520 归一）': 'Capability radar (raw benchmark values; Elo normalized 1200–1520)',
  // Calculator
  '显存与 API 成本计算器': 'VRAM & API cost calculator', '估算开源大模型在不同量化、上下文与并发下的显存占用与 tok/s，以及闭源 API 的日 / 月费用。': 'Estimate VRAM and tok/s for open models across quantization, context and batch, plus daily / monthly cost of closed APIs.',
  '全部在浏览器内计算，纯函数，假设写在底部。': 'Everything runs in the browser as pure functions; assumptions are at the bottom.', '显存估算': 'VRAM estimate', 'API 成本': 'API cost',
  '上下文长度 · {n} token': 'Context length · {n} tokens', '并发 batch · {n}': 'Batch · {n}', '查看 {name} 说明书 →': 'View {name} sheet →', '缺层数 / KV 头': 'Missing layers / KV heads', '合计（估）': 'Total (est.)', '仅权重': 'Weights only', '建议': 'Suggestion',
  '在这张卡上跑（单流吞吐）': 'Run on this GPU (single-stream throughput)', '能装下': 'Fits', '装不下': 'Does not fit', '预填充': 'Prefill',
  '⚠ 该模型缺少层数或 KV 头数，KV Cache 未建模。实际长上下文占用会显著更高。': '⚠ This model lacks layer or KV-head counts, so KV cache is not modeled. Real long-context usage will be much higher.', '本次假设': 'Assumptions used', '模型页备注：': 'Model page note: ',
  '公式与假设': 'Formulas & assumptions', 'MVP 简化公式；能加载 ≠ 能在满上下文 / 高并发下舒服跑。': 'Simplified MVP formulas; loading ≠ running comfortably at full context / high concurrency.',
  [`weight_mem ≈ params_b × bytes_per_param × 1.08
kv_mem     ≈ layers × kv_heads × head_dim × 2 × seq × batch × dtype_bytes × 1.2

bytes_per_param: {bpp}
· 若数据表有官方 / 社区 GGUF 文件大小，优先用该值 × 1.04
· MoE 权重全部驻留显存（不做专家 offload）
· KV dtype：BF16/Q 系列按 2 B，FP8 按 1 B（FP8 KV）
· MLA 模型（DeepSeek / Kimi）按 kv_heads=1、head_dim=288 等效换算 576 维潜向量
· 混合线性注意力（Qwen3-Next）只对全注意力层计 KV
· 滑窗模型（Gemma 3 / gpt-oss）只对全局层计 KV，滑窗层视为常数
· 不含 CUDA context（~0.5–1 GB）、激活、投机解码 draft 模型`]: `weight_mem ≈ params_b × bytes_per_param × 1.08
kv_mem     ≈ layers × kv_heads × head_dim × 2 × seq × batch × dtype_bytes × 1.2

bytes_per_param: {bpp}
· If an official / community GGUF file size is in the data, use it × 1.04 instead
· MoE weights fully resident in VRAM (no expert offload)
· KV dtype: BF16/Q series = 2 B, FP8 = 1 B (FP8 KV)
· MLA models (DeepSeek / Kimi): kv_heads=1, head_dim=288 equivalent for the 576-dim latent
· Hybrid linear attention (Qwen3-Next): KV counted only for full-attention layers
· Sliding-window models (Gemma 3 / gpt-oss): KV counted only for global layers; window layers treated as constant
· Excludes CUDA context (~0.5–1 GB), activations and speculative-decoding draft models`,
  '模型（有公开价）': 'Model (public pricing)', '日请求量': 'Requests per day', '平均输入 token': 'Avg input tokens', '平均输出 token': 'Avg output tokens', '日费': 'Per day', '月费 (30 天)': 'Per month (30 days)', '单次': 'Per request', '相近成本的模型对照': 'Models with similar cost', '日': 'day',
  '价格 = 每百万 token 官方价或第三方托管常见价（标注于模型页），不含缓存折扣、批处理折扣、长上下文加价与推理 token。数据日期见模型页。': 'Price = official per-million-token price or common third-party hosted price (noted on the model page); excludes cache discounts, batch discounts, long-context surcharges and reasoning tokens. See model page for data date.',
  // Hardware
  '我的显卡能跑哪些大模型': 'Which models can my GPU run', '选择 RTX 4090 / 5090 / A100 / H100 / Mac 等显卡与数量，列出能本地运行的开源大模型、最佳量化与预估 tok/s。': 'Pick RTX 4090 / 5090 / A100 / H100 / Mac and count to list open models you can run locally, with best quant and estimated tok/s.',
  '我的显卡能跑谁': 'What can my GPU run', '选显卡与数量，列出能装下的开源模型、最佳量化与预估单流吞吐。所有数字为估算，见底部假设。': 'Pick a GPU and count to list open models that fit, with best quant and estimated single-stream throughput. All numbers are estimates; see assumptions below.',
  '数量': 'Count', '含旧代': 'Include older', '总显存': 'Total VRAM', '总带宽': 'Total bandwidth', 'FP16 算力': 'FP16 compute', '可跑模型': 'Runnable models', '这个配置装不下任何收录的开源模型，试试加卡或降上下文。': 'No listed open model fits this setup; try more GPUs or a shorter context.',
  '占用': 'Used', '旧代': 'Older', '估算假设': 'Estimation assumptions', '与模型详情页「硬件与吞吐」一致，可在方法论页查看。': 'Same as the "Hardware & throughput" section on model pages; see Methodology.',
  [`占用     = 权重(量化) + KV(上下文) + 1.2 GB × 卡数
解码 tok/s = 带宽 × 卡数 × eff ÷ (激活参数 × 每参数字节 + KV/token × 上下文)
            eff：单卡 0.65 · 多卡张量并行 0.55 · Mac/统一内存 0.5
预填充 tok/s = FP16 TFLOPS × 卡数 × 0.45 ÷ (2 × 激活参数)
量化选择：在能装下的前提下取最高精度（BF16 > FP8 > Q8 > Q6 > Q5 > Q4）
MoE：解码只读激活参数；权重全部驻留显存（不做专家 offload）
未建模 KV 的模型（缺层数 / 头数）：只按权重判断能否装下
误差 ±30%；llama.cpp 单卡通常接近上限，vLLM 多卡略低，PCIe 多卡再打折`]: `used       = weights(quant) + KV(context) + 1.2 GB × GPUs
decode tok/s = bandwidth × GPUs × eff ÷ (active params × bytes/param + KV/token × context)
            eff: single GPU 0.65 · multi-GPU tensor parallel 0.55 · Mac/unified memory 0.5
prefill tok/s = FP16 TFLOPS × GPUs × 0.45 ÷ (2 × active params)
Quant choice: highest precision that fits (BF16 > FP8 > Q8 > Q6 > Q5 > Q4)
MoE: decode reads only active params; all weights stay in VRAM (no expert offload)
Models without modeled KV (missing layers / heads): fit judged by weights only
±30% error; llama.cpp single-GPU is usually near the ceiling, vLLM multi-GPU a bit lower, PCIe multi-GPU lower still`,
  '显卡表在': 'GPU table is in', '，带宽 / 算力为公开规格，价格为参考。': '; bandwidth / compute are public specs, prices are indicative. ', '按精确上下文与并发算显存 →': 'Compute VRAM for exact context and batch →',
  // perf tiers
  '消费级': 'Consumer', '工作站': 'Workstation', '数据中心': 'Data center', '统一内存': 'Unified memory',
  // NotFound
  '页面不存在': 'Page not found', '回首页': 'Back to home',
  '只看当前代': 'Current generation only',
  '已隐藏 {n} 个旧代': '{n} superseded hidden',
  '第 {a}–{b} 条，共 {c} 条': '{a}–{b} of {c}',
  '每页条数': 'Rows per page',
  '{n} / 页': '{n} / page',
  "选择显卡、每机卡数与机器台数，设置精度、上下文、并发与电价，计算能运行的开源模型、吞吐与自建每百万 token 成本。": "Pick a GPU, GPUs per node and node count; set precision, context, concurrency and power price to estimate runnable open models, throughput and self-hosted cost per million tokens.",
  "配置集群规格、精度、上下文与成本参数，估算能运行的开源模型、吞吐与自建每百万 token 成本。所有数字为估算，假设见底部。": "Configure cluster, precision, context and cost parameters to estimate runnable open models, throughput and self-hosted cost per 1M tokens. All figures are estimates; see assumptions below.",
  "集群规格": "Cluster",
  "显卡型号": "GPU model",
  "每机卡数": "GPUs / node",
  "机器台数": "Nodes",
  "互联：{note} · 带宽效率 {eff}": "Interconnect: {note} · bandwidth efficiency {eff}",
  "推理配置": "Inference",
  "自动": "Auto",
  "上下文长度": "Context length",
  "并发请求数（batch）· {n}": "Concurrency (batch) · {n}",
  "成本参数": "Cost",
  "电价 ¥/kWh": "Power ¥/kWh",
  "每日运行小时": "Hours / day",
  "折旧期（月）": "Depreciation (months)",
  "汇率 USD→CNY": "FX USD→CNY",
  "整机价 = 卡价 × 卡数 + 每机底价 {base}（机箱 / CPU / 内存 / 网卡）；功耗 = TDP × 卡数 + 每机底耗 {w}W": "Capex = GPU price × count + {base} per node (chassis / CPU / RAM / NIC); power = TDP × count + {w}W per node",
  "总卡数": "GPUs",
  "整机价格": "Capex",
  "云租用 ≈${h}/h": "Cloud ≈ ${h}/h",
  "满载功耗": "Power",
  "{kwh} kWh/天": "{kwh} kWh/day",
  "月电费": "Monthly power",
  "月总成本": "Monthly total",
  "含折旧 {m} 个月": "incl. {m}-month depreciation",
  "只看能装下的": "Only models that fit",
  "{n} 个模型": "{n} models",
  "这个配置装不下任何收录的开源模型，试试加卡、降精度或降上下文。": "Nothing fits this configuration; add GPUs, lower precision or shorten context.",
  "权重 + KV + 开销 / 总显存": "Weights + KV + overhead / total VRAM",
  "单流 tok/s": "Single tok/s",
  "并发 {b} 下的聚合吞吐，受算力上限约束": "Aggregate throughput at batch {b}, capped by compute",
  "聚合 tok/s": "Aggregate tok/s",
  "电费 + 折旧 ÷ 聚合吞吐；括号内仅电费": "(power + depreciation) ÷ aggregate throughput; parentheses = power only",
  "自建 ¥/1M tok": "Self-host ¥/1M tok",
  "该模型官方 / 常见托管 API 输出价换算": "Official / common hosted API output price, converted",
  "API ¥/1M": "API ¥/1M",
  "差 {g}": "short by {g}",
  "KV 未建模": "KV not modeled",
  "已达算力上限": "compute-bound",
  "与模型详情页「硬件与吞吐」同源；误差 ±30%，多机再打折。": "Same model as the detail page; ±30% error, worse across nodes.",
  "，规格为公开数据，价格 / TDP / 底价为参考值。": "; specs are public, prices / TDP / node base are reference values.",
  "单卡": "single GPU",
  "NVLink 张量并行": "NVLink tensor parallel",
  "PCIe 张量并行": "PCIe tensor parallel",
  " + 跨机（IB/RoCE）": " + multi-node (IB/RoCE)",
  "闭源": "closed",
  "显存不足": "out of VRAM",
  "带宽低，解码慢": "low bandwidth, slow decode",
  "中国特供：带宽高、算力低，预填充慢": "China SKU: high bandwidth, low compute, slow prefill",
  "ROCm 生态，vLLM 支持良好": "ROCm; good vLLM support",
  "需 MindIE / vLLM-Ascend，算子覆盖有限": "needs MindIE / vLLM-Ascend; limited kernels",
  "统一内存，按 120GB 可用计": "unified memory, ~120GB usable",
  "统一内存，按 490GB 可用计": "unified memory, ~490GB usable",
  "统一内存，带宽偏低": "unified memory, low bandwidth",
  "统一内存，按 56GB 可用计": "unified memory, ~56GB usable",
  "统一内存，按 240GB 可用计": "unified memory, ~240GB usable",
  "中文 Elo": "Chinese Elo",
  "AA 指数": "AA index",
  "代码（SWE / LCB）": "Coding (SWE / LCB)",
  "推理（GPQA）": "Reasoning (GPQA)",
  "数学（AIME）": "Math (AIME)",
  "Agent（τ² / TB）": "Agent (τ² / TB)",
  "多模态（MMMU）": "Multimodal (MMMU)",
  "数据更新": "Data updated",
  "总参数": "Total params",
  "激活参数": "Active params",
  "输入价格": "Input price",
  "输出价格": "Output price",
  "首 token 延迟": "TTFT",
  "评分": "Scores",
  "时间": "Time",
  "规格": "Specs",
  "其它": "Other",
  "{n} 个筛选生效": "{n} filters active",
  "升序": "Ascending",
  "降序": "Descending",
  "切换排序方向": "Toggle sort direction",
  "发布年份": "Release year",
  "上下文 ≥": "Context ≥",
  "任意": "Any",
  "不可商用": "Non-commercial",
  "视频": "Video",
  "音频": "Audio",
  "无思考": "No thinking",
  "输入价格 ≤ $/1M": "Input price ≤ $/1M",
  "数据": "Data",
  "有完整说明书": "Full sheet",
  "有独立复测": "Independently tested",
  "点击排序": "Click to sort",
  "下载版本": "Downloads",
  "官方与社区量化 / 格式变体，仓库均已核实存在；文件大小取自仓库文件列表（GB）。社区仓库质量请自行评估。": "Official and community quantizations / formats; every repo verified to exist; sizes read from the repo file list (GB). Judge community repos yourself.",
  "格式": "Format",
  "发布者": "Publisher",
  "仓库": "Repository",
  "下载格式": "Download format",
}
