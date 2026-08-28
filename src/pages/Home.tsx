import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { buildRows, SCENES } from '@/lib/leaderboard'
import { changelog, meta, models, scoreMap } from '@/lib/catalog'
import { isOpenWeights, getScore } from '@/lib/scoring'
import { fitsIn } from '@/lib/vram'
import { priceLabel, formatGB, cx } from '@/lib/format'
import { PriceScatter } from '@/components/charts/PriceScatter'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { OpennessBadge } from '@/components/ui/Badge'
import { Section, Chip, Button, Disclaimer } from '@/components/ui/Misc'
import { useCompareIds } from '@/hooks/useCompare'
import type { Model } from '@/lib/types'

function HeroCard({ title, m, reason, stat, statLabel, tone }: { title: string; m?: Model; reason: string; stat: string; statLabel: string; tone: 'open' | 'closed' | 'accent' }) {
  if (!m) return <div className="card p-4 text-sm text-muted">{title}：暂无数据</div>
  const bar = tone === 'open' ? 'bg-open' : tone === 'closed' ? 'bg-closed' : 'bg-accent'
  return (
    <Link to={`/models/${m.id}`} className="card group relative overflow-hidden p-4 md:p-5 hover:border-text/30 transition">
      <span className={cx('absolute left-0 top-0 h-full w-1', bar)} />
      <div className="text-[11px] uppercase tracking-wider text-muted">{title}</div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold tracking-tight group-hover:underline">{m.name}</div>
          <div className="truncate text-xs text-muted">{m.vendor_zh ? `${m.vendor} ${m.vendor_zh}` : m.vendor}</div>
        </div>
        <OpennessBadge m={m} />
      </div>
      <p className="mt-3 text-sm leading-relaxed line-clamp-2">{reason}</p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="num text-xl md:text-2xl font-semibold whitespace-nowrap">{stat}</span>
        <span className="text-xs text-muted">{statLabel}</span>
      </div>
    </Link>
  )
}

export default function Home() {
  const all = useMemo(() => buildRows('all', 'overall'), [])
  const [ids, setIds] = useCompareIds()
  const closed = all.find((r) => !isOpenWeights(r.m))
  const open = all.find((r) => isOpenWeights(r.m))
  const value = useMemo(() => buildRows('all', 'value')[0], [])
  const single = useMemo(() => buildRows('open', 'single-gpu')[0], [])
  const recent = changelog.slice(0, 8)
  const toggle = (id: string) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
  const currentCount = models.filter((m) => m.status === 'current' || m.status === 'preview').length
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">模型选型，先看能不能跑、再看分数。</h1>
        <p className="text-muted max-w-2xl text-sm md:text-base">开源 / 闭源同场分栏、每个模型一份统一骨架的说明书、显存与价格是一等公民、所有数字带来源与日期。收录 {models.length} 个模型，其中 {currentCount} 个当前代。</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HeroCard title="闭源第一" m={closed?.m} reason={closed?.m.copy.one_liner ?? ''} stat={closed?.refScore?.toFixed(1) ?? '—'} statLabel="综合参考分" tone="closed" />
        <HeroCard title="开源第一" m={open?.m} reason={open?.m.copy.one_liner ?? ''} stat={open?.refScore?.toFixed(1) ?? '—'} statLabel="综合参考分" tone="open" />
        <HeroCard title="性价比第一" m={value?.m} reason={value?.m.copy.one_liner ?? ''} stat={value ? priceLabel(value.m) : '—'} statLabel="$ / 百万 token" tone="accent" />
        <HeroCard title="单卡可跑第一" m={single?.m} reason={single?.m.copy.one_liner ?? ''} stat={single ? formatGB(single.m.memory.weight_gb.q4) : '—'} statLabel="Q4 权重" tone="open" />
      </div>

      <Section title="能力 × 价格" sub="点可点进详情。开源模型若无官方 API 价，用第三方托管常见价并以空心点标注。">
        <PriceScatter rows={all} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Section title="综合榜 Top 10" sub="默认权重可在方法论页查看；勾选最多 4 个去对比。" right={<Button to="/leaderboard" variant="outline">查看完整榜单 →</Button>}>
          <LeaderboardTable rows={all.slice(0, 10)} selected={ids} onToggle={toggle} cols={[]} />
          <Disclaimer />
        </Section>
        <div className="space-y-6">
          <Section title="场景入口">
            <div className="flex flex-wrap gap-2">
              {SCENES.filter((s) => s.key !== 'overall').map((s) => <Chip key={s.key} to={`/leaderboard/${s.key}`}>{s.label}</Chip>)}
            </div>
          </Section>
          <Section title="最近变动" right={<Link to="/changelog" className="text-xs link">全部</Link>}>
            <ul className="card divide-y divide-border text-sm">
              {recent.map((c, i) => (
                <li key={i} className="flex gap-3 px-3 py-2">
                  <span className={cx('num text-[10px] mt-1 w-8 shrink-0 font-semibold', c.type === 'up' ? 'text-up' : c.type === 'down' ? 'text-down' : c.type === 'new' ? 'text-accent' : 'text-muted')}>
                    {c.type === 'up' ? '↑' : c.type === 'down' ? '↓' : c.type === 'new' ? 'NEW' : 'DOC'}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted num">{c.date}</span>
                    {c.model_id ? <Link to={`/models/${c.model_id}`} className="hover:underline">{c.text}</Link> : c.text}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      {ids.length > 0 && <CompareBar ids={ids} onClear={() => setIds([])} />}
      <p className="text-xs text-muted">数据快照 {meta.data_cutoff}。{meta.note}</p>
    </div>
  )
}

export function CompareBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const names = ids.map((id) => models.find((m) => m.id === id)?.name ?? id)
  return (
    <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 card flex items-center gap-3 px-4 py-2 shadow-2xl max-w-[calc(100vw-2rem)]">
      <span className="text-sm truncate">已选 {ids.length}：<span className="text-muted">{names.join('、')}</span></span>
      <Button variant="ghost" onClick={onClear}>清空</Button>
      <Button variant="primary" to={`/compare?ids=${ids.join(',')}`} disabled={ids.length < 2}>去对比 →</Button>
    </div>
  )
}

export function scoreOf(m: Model, key: string) { return getScore(scoreMap, m.id, key)?.value }
export const _fits = fitsIn
