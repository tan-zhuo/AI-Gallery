// 模型库 / 排行榜 的表格与图例文案
export const en_d: Record<string, string> = {
  // 工具条
  '{n} 个筛选生效': '{n} filters active',
  '按 {key} {dir}': 'sorted by {key}, {dir}',
  '升序': 'ascending',
  '降序': 'descending',
  '切换排序方向': 'Toggle sort direction',
  '点击排序': 'click to sort',
  '怎么读这张表': 'How to read this table',
  '重置列宽': 'Reset column widths',
  '视图': 'View',
  '表格': 'Table',
  '卡片': 'Cards',
  '紧凑': 'Compact',
  '舒适': 'Comfortable',
  '列的含义': 'What each column means',

  // 列名
  '定位': 'Positioning',
  '参考分': 'Ref. score',

  // 筛选侧栏（原先缺的几项）
  '发布年份': 'Release year',
  '上下文 ≥': 'Context ≥',
  '输入价格 ≤ $/1M': 'Input price ≤ $/1M',
  '下载格式': 'Download format',
  '有完整说明书': 'Has full sheet',
  '有独立复测': 'Independently verified',

  // 列说明
  '当前排序下的序号，不是榜单名次。': 'Position in the current sort — not a leaderboard rank.',
  '名称 · 中文名 · 厂商。点进去是完整说明书。': 'Name · local name · vendor. Click through for the full spec sheet.',
  '一句话说明这个模型是什么、为谁而造。超宽屏才显示，窄屏请切「卡片」视图或点进详情页。': 'One line on what the model is and who it is for. Shown on very wide screens only — otherwise switch to Cards or open the model.',
  '开源 = 权重可下载且许可证允许自建；闭源 = 只有 API。': 'Open = downloadable weights under a license that allows self-hosting. Closed = API only.',
  '综合参考分（0–100）：AA 指数 35% · Arena 25% · 代码 20% · 推理 20%，缺项权重按现有项重分配。横条以当前列表最高分为满格，只用来看相对差距。': 'Composite reference score (0–100): AA index 35% · Arena 25% · coding 20% · reasoning 20%; missing components are redistributed over the rest. The bar is scaled to the highest score in the current list and only shows relative distance.',
  '首次公开发布日期，不是本站数据更新日期。': 'First public release date — not the date this site last updated the row.',
  'MoE 模型写「总参数 / 每 token 激活参数」；闭源一律「未披露」。': 'MoE models show total / active-per-token parameters. Closed models are always "undisclosed".',
  '官方标称的最大输入窗口；长文实际可用长度通常更短。': 'Vendor-stated maximum input window; usable length on long documents is normally shorter.',
  '官方 API 价，USD / 百万 token，输入 / 输出。开源模型没有官方价时写「自建」。': 'Official API price, USD per million tokens, input / output. Open models with no official price show "self-host".',
  'Q4_K_M 或等效 4bit 量化后的权重体积，不含 KV Cache 与运行时开销。': 'Weight size after Q4_K_M or equivalent 4-bit quantization. Excludes KV cache and runtime overhead.',
  '逐字抄自官方；带附加限制或不可商用的标为橙色。': 'Copied verbatim from the vendor. Restricted or non-commercial licenses are marked orange.',
  '所有分数都是手工维护的静态快照，每条都带来源、日期与证据等级，详情页可逐条核对。': 'Every score is a hand-maintained static snapshot carrying its source, date and evidence level; each one is auditable on the model page.',

  // 模型详情页右栏
  '本页目录': 'On this page',
  '证据构成': 'Evidence mix',
  '逐条查看': 'See each score',
  '同家族': 'Same family',
  '综合榜': 'Overall',
  '开源榜': 'Open',
  '闭源榜': 'Closed',
  '算法': 'Algorithm',
  '部分数据': 'Partial data',

  // 价格散点图
  'X：输入价格 USD / 百万 token（对数）· Y：综合参考分': 'X: input price USD / 1M tokens (log) · Y: composite reference score',
  '空心 = 第三方托管价': 'hollow = third-party hosted price',

  // 首页
  '综合榜 Top 30': 'Overall Top 30',
  '数据快照 {d}。分数与价格为手工维护的静态快照，每条带来源、日期与证据等级。': 'Data snapshot {d}. Scores and prices are a hand-maintained static snapshot; each carries its source, date and evidence level.',
  '本次更新了什么 →': 'What changed →',
}
