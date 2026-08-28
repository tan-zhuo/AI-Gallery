// 本地脚本：把紧凑的分数表展开为 data/scores.json。只在维护者电脑跑，不是线上服务。
import { writeFileSync } from 'node:fs'
const AS = '2025-12-20'
const SRC = {
  arena: { source: 'LMArena Text (style control)', url: 'https://lmarena.ai/leaderboard/text', evidence: 'independent' },
  aa: { source: 'Artificial Analysis Intelligence Index v3', url: 'https://artificialanalysis.ai/leaderboards/models', evidence: 'independent' },
}
// [model_id, arena, aa, swe_verified, livecodebench, gpqa, hle, aime25, tau2, terminal, mmmu, official_source, official_url]
const rows = [
  ['gemini-3-pro', 1501, 73, 76.2, null, 91.9, 37.5, 95.0, 85.4, 54.2, 81.0, 'Google 官方模型页', 'https://deepmind.google/models/gemini/pro/'],
  ['claude-opus-4-5', 1470, 70, 80.9, null, 87.0, null, null, 88.9, 59.3, 80.7, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-opus-4-5'],
  ['gpt-5-1', 1461, 70, 76.3, null, 88.1, 26.5, null, null, null, null, 'OpenAI 发布公告', 'https://openai.com/index/gpt-5-1/'],
  ['gpt-5', 1440, 68, 74.9, null, 85.7, 24.8, 94.6, 81.1, null, 84.2, 'OpenAI GPT-5 发布公告', 'https://openai.com/index/introducing-gpt-5/'],
  ['gemini-3-flash', 1470, 71, 78.0, null, 90.4, 33.7, null, null, 51.5, 81.2, 'Google 官方模型页', 'https://deepmind.google/models/gemini/flash/'],
  ['claude-sonnet-4-5', 1450, 63, 77.2, null, 83.4, null, 87.0, 84.7, 50.0, 77.8, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-sonnet-4-5'],
  ['grok-4', 1430, 65, 75.0, null, 87.5, 25.4, 91.7, null, null, null, 'xAI 发布公告', 'https://x.ai/news/grok-4'],
  ['grok-4-1-fast', 1440, 60, null, null, null, 17.6, null, 93.0, null, null, 'xAI 发布公告', 'https://x.ai/news/grok-4-1-fast'],
  ['claude-opus-4-1', 1447, 59, 74.5, null, 80.9, null, 78.0, null, 43.3, 77.1, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-opus-4-1'],
  ['claude-haiku-4-5', 1400, 55, 73.3, null, 73.0, null, 80.6, 79.6, 41.0, 70.0, 'Anthropic 发布公告', 'https://www.anthropic.com/news/claude-haiku-4-5'],
  ['gemini-2-5-pro', 1451, 60, 63.8, 69.0, 86.4, 21.6, 88.0, null, null, 82.0, 'Google 模型页', 'https://deepmind.google/models/gemini/pro/'],
  ['gemini-2-5-flash', 1400, 54, 60.4, null, 82.8, 11.0, 72.0, null, null, 79.7, 'Google 模型页', 'https://deepmind.google/models/gemini/flash/'],
  ['gpt-5-mini', 1400, 64, null, null, 82.3, 16.7, 91.1, null, null, 81.6, 'OpenAI 模型页', 'https://platform.openai.com/docs/models/gpt-5-mini'],
  ['mistral-medium-3-1', 1370, 42, null, null, null, null, null, null, null, null, 'Mistral 发布公告', 'https://mistral.ai/news/mistral-medium-3'],
  ['qwen3-max', 1428, 56, 69.6, null, null, null, null, 74.8, null, null, 'Qwen 官方博客', 'https://qwen.ai/blog?id=qwen3-max'],
  ['deepseek-v3-2', 1424, 66, 73.1, null, 82.4, 25.1, 93.1, 80.3, 37.7, null, 'DeepSeek-V3.2 模型卡', 'https://huggingface.co/deepseek-ai/DeepSeek-V3.2'],
  ['kimi-k2-thinking', 1436, 67, 71.3, 83.1, 84.5, 23.9, 94.5, 74.3, 47.1, null, 'Moonshot 发布页', 'https://moonshotai.github.io/Kimi-K2/thinking.html'],
  ['kimi-k2-0905', 1420, 50, 69.2, null, 75.1, null, null, 70.0, 44.5, null, 'Kimi K2 模型卡', 'https://huggingface.co/moonshotai/Kimi-K2-Instruct-0905'],
  ['glm-4-6', 1420, 56, 68.0, 82.8, 81.0, null, 93.9, 75.9, 40.5, null, 'GLM-4.6 模型卡', 'https://huggingface.co/zai-org/GLM-4.6'],
  ['glm-4-5-air', 1380, 49, 57.6, null, 75.0, null, 89.4, 68.0, null, null, 'GLM-4.5 模型卡', 'https://huggingface.co/zai-org/GLM-4.5-Air'],
  ['minimax-m2', 1395, 61, 69.4, null, 78.0, null, 78.0, 77.2, 46.3, null, 'MiniMax-M2 模型卡', 'https://huggingface.co/MiniMaxAI/MiniMax-M2'],
  ['qwen3-235b-a22b-thinking-2507', 1420, 57, null, 74.1, 81.1, 18.2, 92.3, 70.0, null, null, 'Qwen3-235B-A22B-Thinking-2507 模型卡', 'https://huggingface.co/Qwen/Qwen3-235B-A22B-Thinking-2507'],
  ['qwen3-next-80b-a3b-thinking', 1390, 54, null, 68.7, 77.2, 13.2, 87.8, 60.0, null, null, 'Qwen3-Next 模型卡', 'https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Thinking'],
  ['qwen3-coder-480b-a35b', 1400, 42, 69.6, null, null, null, null, null, 37.5, null, 'Qwen3-Coder 博客', 'https://qwenlm.github.io/blog/qwen3-coder/'],
  ['qwen3-32b', 1360, 44, null, 65.7, 68.4, null, 72.9, null, null, null, 'Qwen3 技术报告', 'https://arxiv.org/abs/2505.09388'],
  ['qwen3-30b-a3b-thinking-2507', 1370, 46, null, 66.0, 73.4, null, 85.0, null, null, null, 'Qwen3-30B-A3B-Thinking-2507 模型卡', 'https://huggingface.co/Qwen/Qwen3-30B-A3B-Thinking-2507'],
  ['deepseek-r1-0528', 1415, 59, 57.6, 73.3, 81.0, 17.7, 87.5, null, null, null, 'DeepSeek-R1-0528 模型卡', 'https://huggingface.co/deepseek-ai/DeepSeek-R1-0528'],
  ['gpt-oss-120b', 1340, 61, 62.4, null, 80.1, 19.0, 92.5, 67.8, null, null, 'gpt-oss 模型卡', 'https://openai.com/index/introducing-gpt-oss/'],
  ['gpt-oss-20b', 1300, 49, 60.7, null, 71.5, 17.3, 91.7, null, null, null, 'gpt-oss 模型卡', 'https://openai.com/index/introducing-gpt-oss/'],
  ['gemma-3-27b', 1338, 27, null, 29.7, 42.4, null, null, null, null, 64.9, 'Gemma 3 技术报告', 'https://arxiv.org/abs/2503.19786'],
  ['llama-4-maverick', 1330, 36, null, 43.4, 69.8, null, null, null, null, 73.4, 'Llama 4 模型卡', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/'],
  ['llama-4-scout', 1300, 28, null, 32.8, 57.2, null, null, null, null, 69.4, 'Llama 4 模型卡', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/'],
  ['devstral-small-2', null, null, 68.0, null, null, null, null, null, null, null, 'Mistral 发布公告', 'https://mistral.ai/news/devstral-2-vibe-cli'],
  ['mistral-small-3-2', 1320, 30, null, null, null, null, null, null, null, null, 'Mistral 模型卡', 'https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506'],
  ['nemotron-3-nano-30b-a3b', null, 44, null, 68.3, 73.7, null, null, null, null, null, 'NVIDIA 模型卡', 'https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16'],
]
const keys = ['arena_text', 'aa_index', 'swe_verified', 'livecodebench', 'gpqa_diamond', 'hle', 'aime_2025', 'tau2_bench', 'terminal_bench', 'mmmu']
const units = { arena_text: 'elo', aa_index: 'index' }
const out = []
for (const r of rows) {
  const [id, ...vals] = r
  const officialSrc = r[11], officialUrl = r[12]
  keys.forEach((k, i) => {
    const v = vals[i]
    if (v == null) return
    const s = k === 'arena_text' ? SRC.arena : k === 'aa_index' ? SRC.aa : { source: officialSrc, url: officialUrl, evidence: 'official' }
    out.push({ model_id: id, key: k, value: v, unit: units[k] ?? 'percent', source: s.source, source_url: s.url, as_of: AS, evidence: s.evidence })
  })
}
// 中文 Arena（示例，仅部分）
for (const [id, v] of [['deepseek-v3-2', 1440], ['qwen3-max', 1445], ['kimi-k2-thinking', 1442], ['glm-4-6', 1430], ['gemini-3-pro', 1490], ['claude-opus-4-5', 1462], ['gpt-5', 1445], ['qwen3-235b-a22b-thinking-2507', 1425], ['claude-sonnet-4-5', 1440]]) {
  out.push({ model_id: id, key: 'arena_zh', value: v, unit: 'elo', source: 'LMArena Text · Chinese', source_url: 'https://lmarena.ai/leaderboard/text', as_of: AS, evidence: 'independent' })
}
writeFileSync(new URL('../data/scores.json', import.meta.url), JSON.stringify(out, null, 1))
console.log('scores:', out.length)
