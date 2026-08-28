export type EvidenceLevel = 'official' | 'independent' | 'community' | 'unknown'
export type Openness = 'open-weights' | 'api-only' | 'proprietary'
export type Modality = 'text' | 'image' | 'audio' | 'video' | 'tools' | 'computer-use'
export type Quant = 'bf16' | 'fp8' | 'q8' | 'q4'
export type CapabilityKey =
  | 'coding' | 'reasoning' | 'math' | 'knowledge' | 'instruction' | 'agent' | 'multimodal' | 'chinese'

export interface Model {
  id: string
  name: string
  name_zh?: string
  aliases: string[]
  vendor: string
  vendor_zh?: string
  family?: string
  license: string
  license_commercial: boolean | 'restricted'
  openness: Openness
  weights_available: boolean
  weights_url?: string
  status: 'current' | 'preview' | 'deprecated' | 'superseded'
  superseded_by?: string
  released_at?: string
  updated_at: string
  modalities: Modality[]
  reasoning_mode: 'none' | 'optional' | 'default-on'
  architecture: {
    type: 'dense' | 'moe' | 'hybrid' | 'unknown'
    total_params?: string
    active_params?: string
    total_params_b?: number
    active_params_b?: number
    experts?: number
    active_experts?: number
    shared_expert?: boolean
    layers?: number
    kv_layers?: number
    hidden_size?: number
    vocab_size?: number
    kv_heads?: number
    head_dim?: number
    attention?: string
    notes?: string
    undisclosed: boolean
  }
  context: { max_tokens?: number; display: string; max_output?: number }
  memory: {
    weight_gb: Partial<Record<Quant, number>>
    kv_per_token_kib?: number
    kv_note?: string
    ref_hw_24gb?: string
    ref_hw_80gb?: string
    ref_hw_8x80gb?: string
    estimated: boolean
  }
  pricing?: {
    input_per_m?: number
    output_per_m?: number
    currency: 'USD'
    source?: string
    as_of?: string
    note?: string
  }
  runtime?: { tok_s?: number; latency_s?: number; source?: string }
  links: { official?: string; hf?: string; github?: string; paper?: string; pricing?: string }
  copy: {
    one_liner: string
    highlights: string[]
    pitfalls: string[]
    logic_ability: string
    best_for: string[]
    not_for: string[]
  }
  capability_notes: Partial<Record<CapabilityKey, string>>
  /** 说明书长文（markdown）。缺省即「完善中」 */
  sheet?: {
    architecture_md?: string
    memory_md?: string
    training_md?: string
    ecosystem_md?: string
    versions_md?: string
  }
  ecosystem?: {
    engines?: string[]
    finetune?: string
    zh_docs?: '有' | '弱' | '无'
  }
  /** 可选：英/日文案（短文案；长说明书暂只中文） */
  i18n?: Partial<Record<'en' | 'ja', {
    name_zh?: string
    one_liner?: string
    highlights?: string[]
    pitfalls?: string[]
    logic_ability?: string
    best_for?: string[]
    not_for?: string[]
    capability_notes?: Partial<Record<CapabilityKey, string>>
  }>>
  /** 是否完整说明书 */
  complete: boolean
}

export interface ScoreRow {
  model_id: string
  key: string
  value: number
  unit?: 'elo' | 'percent' | 'index' | 'score'
  source: string
  source_url?: string
  as_of: string
  evidence: EvidenceLevel
}

export interface BenchmarkDef {
  key: string
  name: string
  name_zh?: string
  category: 'overall' | 'arena' | 'coding' | 'reasoning' | 'math' | 'agent' | 'multimodal' | 'chinese' | 'long-context' | 'knowledge'
  unit: 'elo' | 'percent' | 'index' | 'score'
  higher_is_better: boolean
  description?: string
}

export interface Meta {
  generated_at: string
  data_cutoff: string
  site_name: string
  version: string
  note?: string
  site_url: string
  author: string
  author_url: string
  repo_url: string
}

export interface ChangeEntry {
  date: string
  type: 'new' | 'up' | 'down' | 'doc' | 'score'
  model_id?: string
  text: string
}

export type Scene =
  | 'overall' | 'coding' | 'reasoning' | 'math' | 'agent' | 'long-context' | 'multimodal' | 'chinese' | 'single-gpu' | 'value'
export type Tab = 'all' | 'open' | 'closed'
