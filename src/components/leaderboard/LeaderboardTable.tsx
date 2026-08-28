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
const KEY_TAG: Record<string, string> = { swe_verified: 'SWE', livecodebench: 'LCB', scicode: 'Sci', tau2_bench: 'τ²', terminal_bench: 'TB', tb_hard: 'TBh', tau2_telecom: 'τ²T', tau3_banking: 'τ³' }
function tagged(v?: number, key?: string) {
  if (v == null) return <span className="text-muted">—</span>
  return <span title={key}>{v.toFixed(1)}<span className="ml-1 text-[9px] text-muted align-top">{key ? KEY_TAG[key] : ''}</span></span>
}

export function LeaderboardTable({ rows, selected, onToggle, showValue, cols: colsProp }: {
  rows: Row[]; selected: string[]; onToggle: (id: string) => void; showValue?: boolean; cols?: OptCol[]
}) {
  const { t } = useT()
  const [stored] = useLocalStorage<OptCol[]>('mb_cols', [])
  const cols = colsProp ?? stored
  const [expanded, setExpanded] = useState<string | null>(null)
  const has = useMemo(() => new Set(cols), [cols])
  const keys = ['sel', 'rank', 'model', 'open', 'score', ...cols, 'ctx', 'price', 'updated']
  const { ref: tref, thProps, Handle, tableStyle } = useColResize('leaderboard', keys)
  return (
    <>
      {/* desktop table */}
      <div className="card hidden md:block overflow-x-auto">
        <table ref={tref} style={tableStyle} className="tbl w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr className="border-b border-border">
              <th {...thProps('sel')} className="w-8 px-3 py-2.5"></th>
              <th {...thProps('rank')} className="w-12 px-2 py-2.5 text-left">#<Handle k="rank" /></th>
              <th {...thProps('model')} className="px-2 py-2.5 text-left">{t('模型')}<Handle k="model" /></th>
              <th {...thProps('open')} className="px-2 py-2.5 text-left">{t('开闭源')}<Handle k="open" /></th>
              <th {...thProps('score')} className="px-2 py-2.5 text-right">{showValue ? t('性价比') : t('参考分')}<Handle k="score" /></th>
              {has.has('elo') && <th {...thProps('elo')} className="px-2 py-2.5 text-right">Elo<Handle k="elo" /></th>}
              {has.has('coding') && <th {...thProps('coding')} className="px-2 py-2.5 text-right">{t('代码')}<Handle k="coding" /></th>}
              {has.has('reasoning') && <th {...thProps('reasoning')} className="px-2 py-2.5 text-right">{t('推理')}<Handle k="reasoning" /></th>}
              {has.has('math') && <th {...thProps('math')} className="px-2 py-2.5 text-right">{t('数学')}<Handle k="math" /></th>}
              {has.has('agent') && <th {...thProps('agent')} className="px-2 py-2.5 text-right">Agent<Handle k="agent" /></th>}
              {has.has('mm') && <th {...thProps('mm')} className="px-2 py-2.5 text-right">{t('多模态')}<Handle k="mm" /></th>}
              <th {...thProps('ctx')} className="px-2 py-2.5 text-right">{t('上下文')}<Handle k="ctx" /></th>
              <th {...thProps('price')} className="px-2 py-2.5 text-right">{t('价格 in / out')}<Handle k="price" /></th>
              {has.has('q4') && <th {...thProps('q4')} className="px-2 py-2.5 text-right">{t('Q4 显存')}<Handle k="q4" /></th>}
              {has.has('license') && <th {...thProps('license')} className="px-2 py-2.5 text-left">{t('许可证')}<Handle k="license" /></th>}
              {has.has('tok') && <th {...thProps('tok')} className="px-2 py-2.5 text-right">tok/s<Handle k="tok" /></th>}
              <th {...thProps('updated')} className="px-2 py-2.5 text-right">{t('更新')}</th>
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
                    <td className="px-2 py-2.5"><span className={cx('num inline-grid h-6 w-6 place-items-center rounded-md text-xs font-semibold', r.rank <= 3 ? 'bg-gradient-to-br from-accent/25 to-accent-2/25 text-text' : 'text-muted')}>{r.rank}</span></td>
                    <td className="px-2 py-2.5 min-w-[220px]"><div className="flex items-center gap-2"><ModelName m={m} />{m.status === 'superseded' && <Badge tone="warn">{t('已被替代')}</Badge>}</div></td>
                    <td className="px-2 py-2.5"><OpennessBadge m={m} /></td>
                    <td className="px-2 py-2.5 text-right num">
                      {showValue ? num(r.value, 1) : num(r.refScore, 1)}
                      {r.ref.partial && <span className="ml-1 text-[10px] text-community" title={t('缺 {list}', { list: r.ref.missing.join(', ') })}>{t('部分')}</span>}
                    </td>
                    {has.has('elo') && <td className="px-2 py-2.5 text-right num">{num(r.elo, 0)}</td>}
                    {has.has('coding') && <td className="px-2 py-2.5 text-right num">{tagged(r.coding, r.codingKey)}</td>}
                    {has.has('reasoning') && <td className="px-2 py-2.5 text-right num">{num(r.reasoning)}</td>}
                    {has.has('math') && <td className="px-2 py-2.5 text-right num">{num(r.math)}</td>}
                    {has.has('agent') && <td className="px-2 py-2.5 text-right num">{tagged(r.agent, r.agentKey)}</td>}
                    {has.has('mm') && <td className="px-2 py-2.5 text-right num">{num(r.mm)}</td>}
                    <td className="px-2 py-2.5 text-right num">{m.context.display}</td>
                    <td className="px-2 py-2.5 text-right num whitespace-nowrap">
                      {priceLabel(m)}
                      {m.pricing?.source?.includes('第三方') && <span className="ml-1 text-[10px] text-muted" title={m.pricing.source}>{t('托管')}</span>}
                    </td>
                    {has.has('q4') && <td className="px-2 py-2.5 text-right num">{formatGB(m.memory.weight_gb.q4)}</td>}
                    {has.has('license') && <td className="px-2 py-2.5 text-xs truncate max-w-[140px]" title={m.license}>{m.license}</td>}
                    {has.has('tok') && <td className="px-2 py-2.5 text-right num" title={m.runtime?.latency_s != null ? t('首 token {s}s · {src}', { s: m.runtime.latency_s, src: m.runtime.source ?? '' }) : undefined}>{m.runtime?.tok_s ?? '—'}</td>}
                    <td className="px-2 py-2.5 text-right num text-muted text-xs">{m.updated_at}</td>
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
