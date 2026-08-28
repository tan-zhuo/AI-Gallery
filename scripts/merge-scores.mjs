// 本地脚本：把紧凑的分数表展开为 data/scores.json。只在维护者电脑跑，不是线上服务。
import { writeFileSync } from 'node:fs'
import { AA, AA_TBV21, ZH } from './aa-2026-08.mjs'
import { rowsHist } from './hist-scores.mjs'
const AS_OLD = '2025-12-20'
const AS_NEW = '2026-08-28'
const SRC = {
  arena: { source: 'LMArena Text (style control)', url: 'https://lmarena.ai/leaderboard/text', evidence: 'independent' },
  aa: { source: 'Artificial Analysis Intelligence Index v3', url: 'https://artificialanalysis.ai/leaderboards/models', evidence: 'independent' },
}
// [model_id, arena, aa, swe_verified, livecodebench, gpqa, hle, aime25, tau2, terminal, mmmu, official_source, official_url]
// ---- 旧代快照（2025-12-20）。AA 指数为 v3 口径，已置 null ----
const rowsOld = [
  ['gemini-3-pro', 1501, null, 76.2, null, 91.9, 37.5, 95.0, 85.4, 54.2, 81.0, 'Google 官方模型页', 'https://deepmind.google/models/gemini/pro/'],
  ['claude-opus-4-5', 1470, null, 80.9, null, 87.0, null, null, 88.9, 59.3, 80.7, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-opus-4-5'],
  ['gpt-5-1', 1461, null, 76.3, null, 88.1, 26.5, null, null, null, null, 'OpenAI 发布公告', 'https://openai.com/index/gpt-5-1/'],
  ['gpt-5', 1440, null, 74.9, null, 85.7, 24.8, 94.6, 81.1, null, 84.2, 'OpenAI GPT-5 发布公告', 'https://openai.com/index/introducing-gpt-5/'],
  ['gemini-3-flash', 1470, null, 78.0, null, 90.4, 33.7, null, null, 51.5, 81.2, 'Google 官方模型页', 'https://deepmind.google/models/gemini/flash/'],
  ['claude-sonnet-4-5', 1450, null, 77.2, null, 83.4, null, 87.0, 84.7, 50.0, 77.8, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-sonnet-4-5'],
  ['grok-4', 1430, null, 75.0, null, 87.5, 25.4, 91.7, null, null, null, 'xAI 发布公告', 'https://x.ai/news/grok-4'],
  ['grok-4-1-fast', 1440, null, null, null, null, 17.6, null, 93.0, null, null, 'xAI 发布公告', 'https://x.ai/news/grok-4-1-fast'],
  ['claude-opus-4-1', 1447, null, 74.5, null, 80.9, null, 78.0, null, 43.3, 77.1, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-opus-4-1'],
  ['claude-haiku-4-5', 1400, null, 73.3, null, 73.0, null, 80.6, 79.6, 41.0, 70.0, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-haiku-4-5'],
  ['gemini-2-5-pro', 1451, null, 63.8, 69.0, 86.4, 21.6, 88.0, null, null, 82.0, 'Google 模型页', 'https://deepmind.google/models/gemini/pro/'],
  ['gemini-2-5-flash', 1400, null, 60.4, null, 82.8, 11.0, 72.0, null, null, 79.7, 'Google 模型页', 'https://deepmind.google/models/gemini/flash/'],
  ['gpt-5-mini', 1400, null, null, null, 82.3, 16.7, 91.1, null, null, 81.6, 'OpenAI 模型页', 'https://platform.openai.com/docs/models/gpt-5-mini'],
  ['mistral-medium-3-1', 1370, null, null, null, null, null, null, null, null, null, 'Mistral 发布公告', 'https://mistral.ai/news/mistral-medium-3'],
  ['qwen3-max', 1428, null, 69.6, null, null, null, null, 74.8, null, null, 'Qwen 官方博客', 'https://qwen.ai/blog?id=qwen3-max'],
  ['deepseek-v3-2', 1424, null, 73.1, null, 82.4, 25.1, 93.1, 80.3, 37.7, null, 'DeepSeek-V3.2 模型卡', 'https://huggingface.co/deepseek-ai/DeepSeek-V3.2'],
  ['kimi-k2-thinking', 1436, null, 71.3, 83.1, 84.5, 23.9, 94.5, 74.3, 47.1, null, 'Moonshot 发布页', 'https://moonshotai.github.io/Kimi-K2/thinking.html'],
  ['kimi-k2-0905', 1420, null, 69.2, null, 75.1, null, null, 70.0, 44.5, null, 'Kimi K2 模型卡', 'https://huggingface.co/moonshotai/Kimi-K2-Instruct-0905'],
  ['glm-4-6', 1420, null, 68.0, 82.8, 81.0, null, 93.9, 75.9, 40.5, null, 'GLM-4.6 模型卡', 'https://huggingface.co/zai-org/GLM-4.6'],
  ['glm-4-5-air', 1380, null, 57.6, null, 75.0, null, 89.4, 68.0, null, null, 'GLM-4.5 模型卡', 'https://huggingface.co/zai-org/GLM-4.5-Air'],
  ['minimax-m2', 1395, null, 69.4, null, 78.0, null, 78.0, 77.2, 46.3, null, 'MiniMax-M2 模型卡', 'https://huggingface.co/MiniMaxAI/MiniMax-M2'],
  ['qwen3-235b-a22b-thinking-2507', 1420, null, null, 74.1, 81.1, 18.2, 92.3, 70.0, null, null, 'Qwen3-235B-A22B-Thinking-2507 模型卡', 'https://huggingface.co/Qwen/Qwen3-235B-A22B-Thinking-2507'],
  ['qwen3-next-80b-a3b-thinking', 1390, null, null, 68.7, 77.2, 13.2, 87.8, 60.0, null, null, 'Qwen3-Next 模型卡', 'https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Thinking'],
  ['qwen3-coder-480b-a35b', 1400, null, 69.6, null, null, null, null, null, 37.5, null, 'Qwen3-Coder 博客', 'https://qwenlm.github.io/blog/qwen3-coder/'],
  ['qwen3-32b', 1360, null, null, 65.7, 68.4, null, 72.9, null, null, null, 'Qwen3 技术报告', 'https://arxiv.org/abs/2505.09388'],
  ['qwen3-30b-a3b-thinking-2507', 1370, null, null, 66.0, 73.4, null, 85.0, null, null, null, 'Qwen3-30B-A3B-Thinking-2507 模型卡', 'https://huggingface.co/Qwen/Qwen3-30B-A3B-Thinking-2507'],
  ['deepseek-r1-0528', 1415, null, 57.6, 73.3, 81.0, 17.7, 87.5, null, null, null, 'DeepSeek-R1-0528 模型卡', 'https://huggingface.co/deepseek-ai/DeepSeek-R1-0528'],
  ['gpt-oss-120b', 1340, null, 62.4, null, 80.1, 19.0, 92.5, 67.8, null, null, 'gpt-oss 模型卡', 'https://openai.com/index/introducing-gpt-oss/'],
  ['gpt-oss-20b', 1300, null, 60.7, null, 71.5, 10.9, 91.7, null, null, null, 'gpt-oss 模型卡', 'https://openai.com/index/introducing-gpt-oss/'],
  ['gemma-3-27b', 1338, null, null, 29.7, 42.4, null, null, null, null, 64.9, 'Gemma 3 技术报告', 'https://arxiv.org/abs/2503.19786'],
  ['llama-4-maverick', 1330, null, null, 43.4, 69.8, null, null, null, null, 73.4, 'Llama 4 模型卡', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/'],
  ['llama-4-scout', 1300, null, null, 32.8, 57.2, null, null, null, null, 69.4, 'Llama 4 模型卡', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/'],
  ['devstral-small-2', null, null, 68.0, null, null, null, null, null, null, null, 'Mistral 发布公告', 'https://mistral.ai/news/devstral-2-vibe-cli'],
  ['mistral-small-3-2', 1320, null, null, null, null, null, null, null, null, null, 'Mistral 模型卡', 'https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506'],
  ['nemotron-3-nano-30b-a3b', null, null, null, 68.3, 73.7, 10.6, 89.1, 49.0, null, null, 'NVIDIA 模型卡', 'https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16'],
]
// ---- 2026 当前代（2026-08-28 联网核对）----
const rowsNew = [
  ['claude-fable-5', 1507, 62, null, null, null, null, null, null, 88.0, null, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-fable-5-mythos-5'],
  ['claude-opus-5', 1492, 63, null, null, null, null, null, null, null, null, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-opus-5'],
  ['claude-sonnet-5', null, 55, null, null, null, null, null, null, 80.4, null, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-sonnet-5'],
  ['claude-opus-4-8', 1481, null, 88.6, null, 93.6, null, null, null, 74.6, null, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-opus-4-8'],
  ['gpt-5-6-sol', 1482, 61, null, null, null, null, null, null, 88.8, null, 'OpenAI 发布公告', 'https://openai.com/index/gpt-5-6/'],
  ['gpt-5-6-terra', null, 57, null, null, null, null, null, null, null, null, 'OpenAI 发布公告', 'https://openai.com/index/gpt-5-6/'],
  ['gpt-5-6-luna', null, 51, null, null, null, null, null, null, null, null, 'OpenAI 发布公告', 'https://openai.com/index/gpt-5-6/'],
  ['gpt-5-5', 1482, null, null, null, null, null, null, null, 88.0, null, 'OpenAI 发布公告', 'https://openai.com/index/introducing-gpt-5-5/'],
  ['gemini-3-1-pro', 1487, 48, 80.6, null, 94.3, 44.4, null, null, 68.5, 80.5, 'Google 官方模型页', 'https://deepmind.google/models/gemini/pro/'],
  ['gemini-3-7-flash', 1490, 56, null, null, null, null, null, null, null, null, 'Google 官方模型卡', 'https://deepmind.google/models/model-cards/gemini-3-7-flash/'],
  ['gemini-3-5-flash-lite', 1458, 37, null, null, null, null, null, null, null, null, 'Google 官方模型卡', 'https://deepmind.google/models/model-cards/gemini-3-5-flash-lite/'],
  ['gemma-4-31b', 1451, 30, null, 80.0, 84.3, 19.5, null, 76.9, null, 76.9, 'Gemma 4 官方模型卡', 'https://ai.google.dev/gemma/docs/core/model_card_4'],
  ['gemma-4-26b-a4b', 1438, 26, null, 77.1, 82.3, 8.7, null, 68.2, null, 73.8, 'Gemma 4 官方模型卡', 'https://ai.google.dev/gemma/docs/core/model_card_4'],
  ['grok-4-5', 1470, 56, null, null, null, null, null, null, null, null, 'xAI 发布公告', 'https://x.ai/news/grok-4-5'],
  ['grok-4-6', 1461, 61, null, null, null, null, null, null, null, null, 'xAI 发布公告', 'https://x.ai/news/grok-4-6'],
  ['grok-4-3', 1442, 38, null, null, null, null, null, null, null, null, 'xAI 模型页', 'https://docs.x.ai/docs/models'],
  ['qwen3-8-27b', 1436, 52, null, 90.3, 89.2, 30.8, null, null, 73.0, null, 'Qwen3.8-27B 模型卡', 'https://huggingface.co/Qwen/Qwen3.8-27B'],
  ['qwen3-8-2-4t-a95b', 1479, 58, null, null, 92.6, 43.6, null, null, 86.6, null, 'Qwen3.8-2.4T-A95B 模型卡（Qwen3.8-Max 列）', 'https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B'],
  ['deepseek-v4-pro', 1462, 53, 80.6, 93.5, 90.1, 42.7, null, null, 87.9, null, 'DeepSeek-V4-Pro 模型卡', 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813'],
  ['deepseek-v4-flash', 1436, 52, 79.0, 91.6, 88.1, 37.8, null, null, 82.7, null, 'DeepSeek-V4-Flash 模型卡', 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731'],
  ['glm-5-2', 1472, 53, null, null, 91.2, 40.5, null, null, 81.0, null, 'GLM-5.2 模型卡', 'https://huggingface.co/zai-org/GLM-5.2'],
  ['glm-5-3', 1484, 60, null, null, null, null, null, null, null, null, 'Z.ai GLM-5.3 文档', 'https://docs.z.ai/guides/llm/glm-5.3'],
  ['glm-5-3-flash', 1469, 57, null, null, null, null, null, null, 84.3, null, 'GLM-5.3-Flash 模型卡', 'https://huggingface.co/zai-org/GLM-5.3-Flash'],
  ['kimi-k3', 1489, 60, null, null, 93.5, 43.5, null, null, 88.3, null, 'Kimi K3 模型卡', 'https://huggingface.co/moonshotai/Kimi-K3'],
  ['kimi-k2-6', 1461, null, 80.2, 89.6, 90.5, 34.7, null, null, 66.7, null, 'Kimi K2.6 模型卡', 'https://huggingface.co/moonshotai/Kimi-K2.6'],
  ['kimi-k2-7-code', null, 43, null, null, null, null, null, null, null, null, 'Kimi K2.7 Code 模型卡', 'https://huggingface.co/moonshotai/Kimi-K2.7-Code'],
  ['minimax-m3', 1442, 45, null, null, null, null, null, null, 66.0, null, 'MiniMax M3 官方博客', 'https://www.minimax.io/blog/minimax-m3'],
  ['minimax-m2-7', null, null, null, null, null, null, null, null, 57.0, null, 'MiniMax M2.7 模型卡', 'https://huggingface.co/MiniMaxAI/MiniMax-M2.7'],
  ['mistral-medium-3-5', null, 30, 77.6, null, null, null, null, null, null, null, 'Mistral Medium 3.5 模型卡', 'https://huggingface.co/mistralai/Mistral-Medium-3.5-128B'],
  ['mistral-large-3', null, 16, null, null, null, null, null, null, null, null, 'Mistral 3 发布公告', 'https://mistral.ai/news/mistral-3/'],
  ['mistral-small-4', null, 20, null, 64, 71.2, null, 84, null, null, null, 'Mistral Small 4 模型卡', 'https://huggingface.co/mistralai/Mistral-Small-4-119B-2603'],
  ['muse-glimmer-30b', null, 35, 76.0, null, 83.5, 22.0, null, null, 51.7, null, 'Muse Glimmer 模型卡', 'https://huggingface.co/meta-models/Muse-Glimmer-30B'],
  ['muse-spark', 1498, 57, null, null, null, 58.0, null, null, null, null, 'Meta Muse Spark 发布公告', 'https://ai.meta.com/blog/introducing-muse-spark-msl/'],
  ['nemotron-3-super-120b-a12b', null, 26, 60.5, 81.2, 79.2, 18.3, 90.2, 61.2, null, null, 'NVIDIA Nemotron 3 Super 模型卡', 'https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16'],
  ['nemotron-3-ultra-550b-a55b', null, 38, 70.7, 89.0, 87.0, null, null, null, 56.4, null, 'NVIDIA Nemotron 3 Ultra 模型卡', 'https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16'],
  ['hunyuan-hy3', 1456, 42, 78.0, null, 90.4, null, null, null, 71.7, null, 'Hy3 模型卡', 'https://huggingface.co/tencent/Hy3'],
  ['step-3-7-flash', null, 31, null, null, null, null, null, null, 59.5, null, 'Step-3.7-Flash 模型卡', 'https://huggingface.co/stepfun-ai/Step-3.7-Flash'],
  ['mimo-v2-5', null, 38, null, null, null, null, null, null, null, null, 'MiMo-V2.5 模型卡', 'https://huggingface.co/XiaomiMiMo/MiMo-V2.5'],
  ['command-a-plus', null, 23, null, null, null, null, null, null, null, null, 'Command A+ 模型卡', 'https://huggingface.co/CohereLabs/command-a-plus-05-2026'],
  ['granite-4-2-30b', null, 24, null, 75.8, 66.4, null, 89.2, null, null, null, 'Granite 4.2 30B 模型卡', 'https://huggingface.co/ibm-granite/granite-4.2-30b'],
]
// ---- 历史模型（2023–2025-08）：每行第 14 个元素为 as_of ----
const rows = [...rowsOld.map((r) => ({ r, as: AS_OLD })), ...rowsNew.map((r) => ({ r, as: AS_NEW })), ...rowsHist.map((r) => ({ r: r.slice(0, 13), as: r[13] }))]
const keys = ['arena_text', 'aa_index', 'swe_verified', 'livecodebench', 'gpqa_diamond', 'hle', 'aime_2025', 'tau2_bench', 'terminal_bench', 'mmmu']
const units = { arena_text: 'elo', aa_index: 'index' }
const out = []
for (const { r, as: AS } of rows) {
  const [id, ...vals] = r
  const officialSrc = r[11], officialUrl = r[12]
  keys.forEach((k, i) => {
    const v = vals[i]
    if (v == null) return
    const s = k === 'arena_text' ? SRC.arena : k === 'aa_index' ? SRC.aa : { source: officialSrc, url: officialUrl, evidence: 'official' }
    out.push({ model_id: id, key: k, value: v, unit: units[k] ?? 'percent', source: s.source, source_url: s.url, as_of: AS, evidence: s.evidence })
  })
}
// ---- Artificial Analysis 统一复测（independent）----
const aaKeys = ['aa_index', 'gpqa_diamond', 'hle', 'aime', null, 'livecodebench', 'scicode', 'tb_hard', 'tau2_telecom', 'mmmu_pro', 'swe_verified', 'ifbench']
for (const r of AA) {
  const [id, ...v] = r
  const url = r[15]
  aaKeys.forEach((k, i) => {
    if (!k || v[i] == null) return
    const key = k === 'aime' ? (v[4] === 2026 ? 'aime_2026' : 'aime_2025') : k
    out.push({ model_id: id, key, value: v[i], unit: key === 'aa_index' ? 'index' : 'percent', source: 'Artificial Analysis (v4.1.1)', source_url: url, as_of: AS_NEW, evidence: 'independent' })
  })
}
for (const [id, tb, tau3] of AA_TBV21) {
  const url = AA.find((r) => r[0] === id)?.[15]
  if (tb != null) out.push({ model_id: id, key: 'terminal_bench', value: tb, unit: 'percent', source: 'Artificial Analysis · Terminal-Bench 2.1', source_url: url, as_of: AS_NEW, evidence: 'independent' })
  if (tau3 != null) out.push({ model_id: id, key: 'tau3_banking', value: tau3, unit: 'percent', source: 'Artificial Analysis · τ³-Bench Banking', source_url: url, as_of: AS_NEW, evidence: 'independent' })
}
for (const [id, v] of ZH) out.push({ model_id: id, key: 'arena_zh', value: v, unit: 'elo', source: 'LMArena Text · Chinese (style control)', source_url: 'https://arena.ai/leaderboard/text/chinese', as_of: AS_NEW, evidence: 'independent' })

// 中文 Arena（旧代快照）
for (const [id, v] of [['deepseek-v3-2', 1440], ['qwen3-max', 1445], ['kimi-k2-thinking', 1442], ['glm-4-6', 1430], ['gemini-3-pro', 1490], ['claude-opus-4-5', 1462], ['gpt-5', 1445], ['qwen3-235b-a22b-thinking-2507', 1425], ['claude-sonnet-4-5', 1440]]) {
  out.push({ model_id: id, key: 'arena_zh', value: v, unit: 'elo', source: 'LMArena Text · Chinese', source_url: 'https://lmarena.ai/leaderboard/text', as_of: AS_OLD, evidence: 'independent' })
}
// 独立来源补充（不在厂商页面上的数字）
out.push({ model_id: 'claude-opus-5', key: 'hle', value: 53.0, unit: 'percent', source: 'Artificial Analysis · Opus 5 评测文章', source_url: 'https://artificialanalysis.ai/articles/opus-5', as_of: AS_NEW, evidence: 'independent' })
out.push({ model_id: 'claude-opus-5', key: 'terminal_bench', value: 89.0, unit: 'percent', source: 'Artificial Analysis · Opus 5 评测文章', source_url: 'https://artificialanalysis.ai/articles/opus-5', as_of: AS_NEW, evidence: 'independent' })
writeFileSync(new URL('../data/scores.json', import.meta.url), JSON.stringify(out, null, 1))
console.log('scores:', out.length)
