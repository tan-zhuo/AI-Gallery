import type { Model } from '@/lib/types'
import { useT } from '@/i18n'

/** 统一图例的架构简图：开源画已知结构，闭源画公开部分，未知用虚线 +「未披露」 */
export function ArchDiagram({ m }: { m: Model }) {
  const { t } = useT()
  const a = m.architecture
  const unknown = a.undisclosed && a.type === 'unknown'
  const isMoe = a.type === 'moe' || a.type === 'hybrid'
  const dash = { strokeDasharray: '4 3' }
  const box = (x: number, y: number, w: number, h: number, label: string, sub?: string, known = true, fill?: string) => (
    <g key={label + y}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill ?? 'var(--surface-2)'} stroke={known ? 'var(--text)' : 'var(--muted)'} strokeWidth={1} {...(known ? {} : dash)} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 4)} textAnchor="middle" fontSize="11" fill="var(--text)" fontWeight={600}>{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 10} textAnchor="middle" fontSize="9.5" fill="var(--muted)" className="num">{sub}</text>}
    </g>
  )
  const arrow = (x: number, y1: number, y2: number) => <line key={`a${y1}`} x1={x} y1={y1} x2={x} y2={y2} stroke="var(--muted)" strokeWidth={1} markerEnd="url(#arr)" />
  const W = 320
  return (
    <svg viewBox={`0 0 ${W} 300`} className="w-full h-auto" role="img" aria-label={t('{name} 架构简图', { name: m.name })}>
      <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--muted)" /></marker></defs>
      {box(100, 8, 120, 28, 'Token Embedding', a.vocab_size ? t('词表 {n}', { n: a.vocab_size.toLocaleString() }) : (unknown ? t('未披露') : undefined), !unknown)}
      {arrow(160, 36, 52)}
      {/* 层块 */}
      <rect x={20} y={54} width={W - 40} height={170} rx={8} fill="none" stroke="var(--border)" strokeWidth={1} {...(unknown ? dash : {})} />
      <text x={30} y={70} fontSize="10" fill="var(--muted)">{t('× {n} 层', { n: a.layers ?? (unknown ? '?' : t('未披露')) })}{a.kv_layers ? t('（{n} 层全注意力）', { n: a.kv_layers }) : ''}</text>
      {box(60, 80, 200, 34, unknown ? t('注意力（未披露）') : t('注意力：{x}', { x: (a.attention ?? t('未披露')).split('（')[0] }), unknown ? undefined : a.kv_heads ? t('KV 头 {n} · head_dim {d}', { n: a.kv_heads, d: a.head_dim ?? '?' }) : (a.attention ? a.attention.replace(/^[^（]*/, '').replace(/[（）]/g, '') : undefined), !unknown)}
      {arrow(160, 114, 130)}
      {isMoe ? (
        <g>
          {box(40, 132, 60, 34, t('路由'), a.active_experts ? `top-${a.active_experts}` : '', !!a.experts)}
          {[0, 1, 2, 3].map((i) => box(110 + i * 44, 132, 38, 34, i === 3 ? '…' : `E${i + 1}`, undefined, !!a.experts))}
          {a.shared_expert && box(60, 176, 200, 26, t('共享专家'), undefined, true, 'var(--open-bg)')}
          <text x={160} y={216} textAnchor="middle" fontSize="10" fill="var(--muted)" className="num">{a.experts ? t('{n} 专家 · 激活 {m}', { n: a.experts, m: a.active_experts ?? '?' }) : t('专家数未披露')}{a.hidden_size ? ` · d=${a.hidden_size}` : ''}</text>
        </g>
      ) : (
        <g>
          {box(60, 132, 200, 34, unknown ? t('FFN / MoE（未披露）') : 'Dense FFN', a.hidden_size ? t('隐藏维 {n}', { n: a.hidden_size }) : undefined, !unknown)}
          <text x={160} y={200} textAnchor="middle" fontSize="10" fill="var(--muted)">{unknown ? t('厂商未公开内部结构') : t('Dense：每个 token 经过全部参数')}</text>
        </g>
      )}
      {arrow(160, 224, 240)}
      {box(100, 242, 120, 28, 'LM Head', a.total_params ? `${a.total_params}${a.active_params ? ' ' + t('/ {a} 激活', { a: a.active_params }) : ''}` : t('参数未披露'), !!a.total_params)}
      <text x={W - 10} y={292} textAnchor="end" fontSize="9" fill="var(--muted)">{t('实线 = 已公开 · 虚线 = 未披露')}</text>
    </svg>
  )
}
