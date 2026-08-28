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
import { LogoMark } from '@/components/ui/Logo'
import { VendorLogo } from '@/components/ui/VendorLogo'
import { scores } from '@/lib/catalog'
import { Section, Chip, Button, Disclaimer } from '@/components/ui/Misc'
import { useCompareIds } from '@/hooks/useCompare'
import { useSeo } from '@/hooks/useSeo'

import type { Model } from '@/lib/types'

function HeroCard({ title, m, reason, stat, statLabel, tone, index }: { title: string; m?: Model; reason: string; stat: string; statLabel: string; tone: 'open' | 'closed' | 'accent'; index: number }) {
  if (!m) return <div className="card p-5 text-sm text-muted">{title}：暂无数据</div>
  const color = tone === 'open' ? 'var(--open)' : tone === 'closed' ? 'var(--closed)' : 'var(--accent)'
  return (
    <Link to={`/models/${m.id}`} className="card card-hover group relative overflow-hidden p-5 flex flex-col">
      <span className="absolute -right-6 -top-8 num text-[96px] font-bold leading-none opacity-[0.045] select-none" style={{ color }}>0{index}</span>
      <div className="flex items-center justify-between">
        <span className="eyebrow inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />{title}</span>
        <OpennessBadge m={m} />
      </div>
      <div className="mt-4 flex items-center gap-3 min-w-0">
        <VendorLogo vendor={m.vendor} size={40} />
        <div className="min-w-0">
          <div className="truncate text-xl font-semibold tracking-tight group-hover:text-accent transition">{m.name}</div>
          <div className="truncate text-xs text-muted mt-0.5">{m.vendor_zh ? `${m.vendor} ${m.vendor_zh}` : m.vendor}</div>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted line-clamp-2 flex-1">{reason}</p>
      <div className="mt-5 flex items-baseline gap-2 border-t border-border pt-4">
        <span className="num text-2xl font-semibold whitespace-nowrap">{stat}</span>
        <span className="text-[11px] text-muted">{statLabel}</span>
      </div>
    </Link>
  )
}

export default function Home() {
  useSeo({ title: 'AI-Gallery', description: `AI 模型排行榜与说明书：开源 / 闭源分栏、显存与价格、显卡配置与吞吐估算、带来源的评测分数。收录 ${models.length} 个模型。`, path: '/', jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'AI-Gallery', url: meta.site_url, description: 'AI 模型排行与说明书', author: { '@type': 'Person', name: meta.author, url: meta.author_url } } })
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
    <div className="space-y-12">
      <section className="relative -mx-4 -mt-6 md:-mt-8 px-4 pt-12 pb-10 md:pt-16 md:pb-14 hero-bg overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
        <div className="relative mx-auto max-w-7xl grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur"><LogoMark size={16} />AI-Gallery · 数据快照 <span className="num text-text">{meta.data_cutoff}</span></div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.15]">模型选型，<br className="hidden md:block" />先看<span className="gradient-text">能不能跑</span>，再看分数。</h1>
            <p className="text-muted max-w-xl text-sm md:text-base leading-relaxed">开源 / 闭源同场分栏；每个模型一份统一骨架的说明书；显存与价格是一等公民；所有数字带来源、日期与证据等级。</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="primary" to="/leaderboard">查看排行榜</Button>
              <Button variant="outline" to="/hardware">我的显卡能跑谁</Button>
              <Button variant="ghost" to="/methodology">方法论 →</Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px rounded-2xl border border-border bg-border overflow-hidden">
            {[[models.length, '收录模型'], [currentCount, '当前代'], [models.filter((m) => m.complete).length, '完整说明书'], [scores.length, '带来源分数']].map(([v, l]) => (
              <div key={l} className="bg-surface p-4"><dt className="eyebrow">{l}</dt><dd className="num text-2xl md:text-3xl font-semibold mt-1">{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HeroCard index={1} title="闭源第一" m={closed?.m} reason={closed?.m.copy.one_liner ?? ''} stat={closed?.refScore?.toFixed(1) ?? '—'} statLabel="综合参考分" tone="closed" />
        <HeroCard index={2} title="开源第一" m={open?.m} reason={open?.m.copy.one_liner ?? ''} stat={open?.refScore?.toFixed(1) ?? '—'} statLabel="综合参考分" tone="open" />
        <HeroCard index={3} title="性价比第一" m={value?.m} reason={value?.m.copy.one_liner ?? ''} stat={value ? priceLabel(value.m) : '—'} statLabel="$ / 百万 token" tone="accent" />
        <HeroCard index={4} title="单卡可跑第一" m={single?.m} reason={single?.m.copy.one_liner ?? ''} stat={single ? formatGB(single.m.memory.weight_gb.q4) : '—'} statLabel="Q4 权重" tone="open" />
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
