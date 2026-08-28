/** 厂商 → public/logos 下的真实 logo 文件。mono=true 表示单色 SVG（深色模式反色显示）。 */
export const VENDOR_LOGOS: Record<string, { file: string; mono: boolean }> = {
  Anthropic: { file: 'anthropic.svg', mono: true },
  OpenAI: { file: 'openai.svg', mono: true },
  Google: { file: 'google.svg', mono: true },
  xAI: { file: 'xai-org.png', mono: false },
  Alibaba: { file: 'qwen.svg', mono: true },
  DeepSeek: { file: 'deepseek.svg', mono: true },
  'Z.ai': { file: 'zai-org.png', mono: false },
  'Moonshot AI': { file: 'kimi.svg', mono: true },
  MiniMax: { file: 'minimax.svg', mono: true },
  Meta: { file: 'meta.svg', mono: true },
  'Mistral AI': { file: 'mistralai.svg', mono: true },
  NVIDIA: { file: 'nvidia.svg', mono: true },
  Tencent: { file: 'Tencent-Hunyuan.png', mono: false },
  StepFun: { file: 'stepfun-ai.png', mono: false },
  Xiaomi: { file: 'xiaomi.svg', mono: true },
  Cohere: { file: 'cohere-ai.png', mono: false },
  IBM: { file: 'ibm.svg', mono: true },
  Baidu: { file: 'baidu.svg', mono: true },
  ByteDance: { file: 'bytedance.svg', mono: true },
  Microsoft: { file: 'microsoft.svg', mono: true },
  Amazon: { file: 'amazonaws.svg', mono: true },
}

export function vendorLogo(vendor: string) {
  const v = VENDOR_LOGOS[vendor]
  if (!v) return undefined
  return { src: `${import.meta.env.BASE_URL}logos/${v.file}`, mono: v.mono }
}
