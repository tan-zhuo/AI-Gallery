import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Row } from '@/lib/leaderboard'
import { ModelName } from '../ui/ModelName'
import { OpennessBadge, Badge } from '../ui/Badge'
import { ScoreBar } from '../ui/ScoreBar'
import { formatGB, priceLabel, cx, copyFor } from '@/lib/format'
import { fitsIn } from '@/lib/vram'
import { MAX_COMPARE } from '@/hooks/useCompare'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useColResize } from '../ui/useColResize'
import { useT } from '@/i18n'

export const OPTIONAL_COLS = [
  ['elo', 'Arena Elo'], ['coding', '代码'], ['reasoning', '推理'], ['math', '数学'], ['agent', 'Agent'], ['mm', '多模态'], ['q4', 'Q4 显存'], ['license', '许可证'], ['tok', 'tok/s'],
] as const
export type OptCol = typeof OPTIONAL_COLS[number][0]

function num(v?: number, d = 1) { return v == null ? <span className="text-muted">—</span> : v.toFixed(d) }

/** 表头 tooltip：每列说清楚它是什么，鼠标悬停就能看到，不用跳方法论页。 */
const HELP: Record<string, string> = {
  rank: '当前筛选与场景下的名次，换标签页会变。',
  model: '名称 · 中文名 · 厂商。点行展开摘要，点名字进说明书。',
  desc: '一句话说明这个模型是什么、为谁而造。',
  open: '开源 = 权重可下载且许可证允许自建；闭源 = 只有 API。',
  score: '按当前场景权重算的综合分（0–100）。缺项权重按现有项重分配并标「部分」。横条以本表最高分为满格。',
  value: '综合分 ÷ log(输入价格)，只含有官方或常见托管价的模型。',
  elo: 'LMArena 文本盲测人类偏好 Elo（style control）。',
  coding: '代码能力：优先 SWE-bench Verified，其次 LiveCodeBench / SciCode，右上角小字标明取的是哪个。',
  reasoning: 'GPQA Diamond，研究生级科学问答。',
  math: 'AIME 2025 / 2026。',
  agent: 'τ²-bench / Terminal-Bench 一类的 agent 任务，右上角小字标明来源基准。',
  mm: 'MMMU / MMMU-Pro 多模态理解。',
  ctx: '官方标称的最大输入窗口。',
  price: '官方 API 价，USD / 百万 token，输入 / 输出。标「托管」= 第三方托管常见价。',
  q4: 'Q4 量化后的权重体积，不含 KV Cache。',
  license: '逐字抄自官方。',
  tok: '第三方实测的输出速度，悬停看首 token 延迟与来源。',
  updated: '本站最后核对这一行数据的日期。',
}
const KEY_TAG: Record<string, string> = { swe_verified: 'SWE', livecodebench: 'LCB', scicode: 'Sci', tau2_bench: 'τ²', terminal_bench: 'TB', tb_hard: 'TBh', tau2_telecom: 'τ²T', tau3_banking: 'τ³' }
function tagged(v?: number, key?: string) {
  if (v == null) return <span className="text-muted">—</span>
  return <span title={key}>{v.toFixed(1)}<span className="ml-1 text-[9px] text-muted align-top">{key ? KEY_TAG[key] : ''}</span></span>
}

interface ThOpts { n?: boolean; fit?: boolean; help?: string; className?: string; handle?: boolean }
/** 表头单元：统一补上 tooltip、对齐与拖拽手柄。 */
function Th({ k, children, n, fit, help, className, handle = true, thProps, Handle, t }: ThOpts & {
  k: string; children?: React.ReactNode
  thProps: (k: string) => Record<string, unknown>
  Handle: (p: { k: string }) => React.ReactElement
  t: (s: string) => string
}) {
  return (
    <th {...thProps(k)} scope="col" title={help ?? (HELP[k] ? t(HELP[k]) : undefined)}
      className={cx('px-2 py-2.5', n ? 'text-right' : 'text-left', fit && 'col-fit', className)}>
      {children}{handle && <Handle k={k} />}
    </th>
  )
}

export function LeaderboardTable({ rows, selected, onToggle, showValue, cols: colsProp, desc = true }: {
  rows: Row[]; selected: string[]; onToggle: (id: string) => void; showValue?: boolean; cols?: OptCol[]
  /** 「定位」列。首页把榜单塞在窄栏里，那里关掉。 */
  desc?: boolean
}) {
  const { t, lang } = useT()
  const [stored] = useLocalStorage<OptCol[]>('mb_cols', [])
  const cols = colsProp ?? stored
  const [expanded, setExpanded] = useState<string | null>(null)
  const has = useMemo(() => new Set(cols), [cols])
  const keys = ['sel', 'rank', 'model', ...(desc ? ['desc'] : []), 'open', 'score', ...cols, 'ctx', 'price', 'updated']
  const { ref: tref, thProps, Handle, tableStyle, resetAll, active: resized } = useColResize('leaderboard2', keys)
  // 本表最高分 —— 分数条按它归一，80–99 的差距才看得出来
  const top = useMemo(() => Math.max(1, ...rows.map((r) => (showValue ? r.value : r.refScore) ?? 0)), [rows, showValue])
  const th = (k: string, children?: React.ReactNode, o: ThOpts = {}) => (
    <Th k={k} thProps={thProps} Handle={Handle} t={t} {...o}>{children}</Th>
  )
  return (
    <>
      {/* desktop table */}
      <div className="card hidden md:block overflow-x-auto">
        <table ref={tref} style={tableStyle} className="tbl w-full text-sm">
          <thead>
            <tr>
              {th('sel', null, { className: 'w-8 px-3', handle: false })}
              {th('rank', '#', { className: 'w-12' })}
              {th('model', t('模型'))}
              {desc && th('desc', t('定位'), { className: 'hidden w-full min-[93.75rem]:table-cell' })}
              {th('open', t('开闭源'), { fit: true })}
              {th('score', showValue ? t('性价比') : t('参考分'), { n: true, fit: true, help: t(showValue ? HELP.value : HELP.score) })}
              {has.has('elo') && th('elo', 'Elo', { n: true, fit: true })}
              {has.has('coding') && th('coding', t('代码'), { n: true, fit: true })}
              {has.has('reasoning') && th('reasoning', t('推理'), { n: true, fit: true })}
              {has.has('math') && th('math', t('数学'), { n: true, fit: true })}
              {has.has('agent') && th('agent', 'Agent', { n: true, fit: true })}
              {has.has('mm') && th('mm', t('多模态'), { n: true, fit: true })}
              {th('ctx', t('上下文'), { n: true, fit: true })}
              {th('price', t('价格 in / out'), { n: true, fit: true })}
              {has.has('q4') && th('q4', t('Q4 显存'), { n: true, fit: true })}
              {has.has('license') && th('license', t('许可证'), { fit: true })}
              {has.has('tok') && th('tok', 'tok/s', { n: true, fit: true })}
              {th('updated', t('更新'), { n: true, fit: true, handle: false })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = r.m
              const sel = selected.includes(m.id)
              const isOpen = expanded === m.id
              return (
                <Fragment key={m.id}>
                  <tr className={cx('border-b border-border/60 cursor-pointer', sel && 'bg-surface-2/40', m.status === 'superseded' && 'opacity-60')} onClick={() => setExpanded(isOpen ? null : m.id)} aria-expanded={isOpen}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={sel} disabled={!sel && selected.length >= MAX_COMPARE} onChange={() => onToggle(m.id)} aria-label={t('选择 {name} 加入对比', { name: m.name })} className="accent-[var(--accent)]" />
                    </td>
                    <td className="px-2 py-2.5"><span className={cx('rankbox', r.rank <= 3 && 'top')}>{r.rank}</span></td>
                    <td className="px-2 py-2.5"><div className="w-[clamp(180px,14vw,300px)]"><ModelName m={m} />{m.status === 'superseded' && <span className="tag tag-warn mt-1">{t('已被替代')}</span>}</div></td>
                    {desc && <td className="px-2 py-2.5 hidden min-[93.75rem]:table-cell"><span className="block min-w-[180px] text-[13px] leading-snug text-muted line-clamp-2">{copyFor(m, lang).one_liner}</span></td>}
                    <td className="px-2 py-2.5"><OpennessBadge m={m} /></td>
                    <td className="px-2 py-2.5 n col-fit">
                      {(() => {
                        const v = showValue ? r.value : r.refScore
                        if (v == null) return <span className="text-muted">—</span>
                        return (
                          <span className="inline-block min-w-[3.25rem] text-right align-middle">
                            <span className="block leading-none font-medium">
                              {v.toFixed(1)}
                              {r.ref.partial && <span className="ml-1 text-[10px] text-community" title={t('缺 {list}', { list: r.ref.missing.join(', ') })}>{t('部分')}</span>}
                            </span>
                            <span className="sparkbar mt-1.5 ml-auto w-14"><i style={{ width: `${Math.max(4, Math.min(100, (v / top) * 100))}%` }} /></span>
                          </span>
                        )
                      })()}
                    </td>
                    {has.has('elo') && <td className="px-2 py-2.5 n col-fit">{num(r.elo, 0)}</td>}
                    {has.has('coding') && <td className="px-2 py-2.5 n col-fit">{tagged(r.coding, r.codingKey)}</td>}
                    {has.has('reasoning') && <td className="px-2 py-2.5 n col-fit">{num(r.reasoning)}</td>}
                    {has.has('math') && <td className="px-2 py-2.5 n col-fit">{num(r.math)}</td>}
                    {has.has('agent') && <td className="px-2 py-2.5 n col-fit">{tagged(r.agent, r.agentKey)}</td>}
                    {has.has('mm') && <td className="px-2 py-2.5 n col-fit">{num(r.mm)}</td>}
                    <td className="px-2 py-2.5 n col-fit">{m.context.display}</td>
                    <td className="px-2 py-2.5 n col-fit">
                      {t(priceLabel(m))}
                      {m.pricing?.source?.includes('第三方') && <span className="ml-1 text-[10px] text-muted" title={m.pricing.source}>{t('托管')}</span>}
                    </td>
                    {has.has('q4') && <td className="px-2 py-2.5 n col-fit">{formatGB(m.memory.weight_gb.q4)}</td>}
                    {has.has('license') && <td className="px-2 py-2.5 col-fit text-xs"><span className="block max-w-[150px] truncate" title={m.license}>{m.license}</span></td>}
                    {has.has('tok') && <td className="px-2 py-2.5 n col-fit" title={m.runtime?.latency_s != null ? t('首 token {s}s · {src}', { s: m.runtime.latency_s, src: m.runtime.source ?? '' }) : undefined}>{m.runtime?.tok_s ?? '—'}</td>}
                    <td className="px-2 pr-3 py-2.5 n col-fit text-muted text-xs">{m.updated_at}</td>
                  </tr>
                  {isOpen && (
                    <tr className="expand border-b border-border bg-surface-2/30">
                      <td colSpan={20} className="px-4 py-3">
                        <ExpandRow r={r} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {resized && <div className="hidden md:flex justify-end"><button type="button" onClick={resetAll} className="text-[11px] text-muted hover:text-text">{t('重置列宽')}</button></div>}
      {/* mobile cards */}
      <div className="md:hidden space-y-2">
        {rows.map((r) => {
          const m = r.m, sel = selected.includes(m.id), isOpen = expanded === m.id
          return (
            <div key={m.id} className="card p-3">
              <div className="flex items-center gap-3">
                <span className="num text-muted w-6 text-sm">{r.rank}</span>
                <div className="min-w-0 flex-1"><ModelName m={m} /></div>
                <div className="num text-lg font-semibold">{showValue ? num(r.value) : num(r.refScore)}</div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <OpennessBadge m={m} />
                <span className="num text-muted">{m.context.display}</span>
                <span className="num text-muted">{priceLabel(m)}</span>
                <button type="button" className="ml-auto text-accent" onClick={() => setExpanded(isOpen ? null : m.id)}>{isOpen ? t('收起') : t('展开')}</button>
                <label className="flex items-center gap-1"><input type="checkbox" checked={sel} disabled={!sel && selected.length >= MAX_COMPARE} onChange={() => onToggle(m.id)} aria-label={t('加入对比')} />{t('对比')}</label>
              </div>
              {isOpen && <div className="mt-3 border-t border-border pt-3"><ExpandRow r={r} /></div>}
            </div>
          )
        })}
      </div>
    </>
  )
}

function ExpandRow({ r }: { r: Row }) {
  const { t, lang } = useT()
  const m = r.m
  return (
    <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] text-sm">
      <div className="space-y-2">
        <p className="font-medium">{copyFor(m, lang).one_liner}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge>{m.license}</Badge>
          {m.weights_available && <Badge tone={fitsIn(m, 24) ? 'open' : 'neutral'}>{fitsIn(m, 24) ? t('单卡 24GB 可跑') : m.memory.ref_hw_80gb ? t('推荐 ') + m.memory.ref_hw_80gb.slice(0, 24) : t('多卡')}</Badge>}
          {m.reasoning_mode !== 'none' && <Badge tone="info">{t('推理模型')}</Badge>}
        </div>
        <Link to={`/models/${m.id}`} className="link text-xs">{t('查看说明书 →')}</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <ScoreBar label={t('代码')} value={r.coding} />
        <ScoreBar label={t('推理')} value={r.reasoning} />
        <ScoreBar label={t('数学')} value={r.math} />
        <ScoreBar label="Agent" value={r.agent} />
      </div>
    </div>
  )
}
