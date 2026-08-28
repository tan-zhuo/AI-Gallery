import { useNavigate } from 'react-router-dom'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis } from 'recharts'
import type { Row } from '@/lib/leaderboard'
import { isOpenWeights } from '@/lib/scoring'

export function PriceScatter({ rows }: { rows: Row[] }) {
  const nav = useNavigate()
  const pts = rows.filter((r) => r.refScore != null && r.m.pricing?.input_per_m).map((r) => ({
    id: r.m.id, name: r.m.name, x: r.m.pricing!.input_per_m!, y: r.refScore!, open: isOpenWeights(r.m), hosted: r.m.pricing?.source?.includes('第三方'),
  }))
  const openPts = pts.filter((p) => p.open), closedPts = pts.filter((p) => !p.open)
  const dot = (color: string) => (props: { cx?: number; cy?: number; payload?: { hosted?: boolean; id: string } }) => {
    const { cx = 0, cy = 0, payload } = props
    return <circle cx={cx} cy={cy} r={6} fill={payload?.hosted ? 'transparent' : color} stroke={color} strokeWidth={2} style={{ cursor: 'pointer' }} onClick={() => payload && nav(`/models/${payload.id}`)} />
  }
  return (
    <div className="card p-3 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted mb-2">
        <span>X：输入价格 USD / 百万 token（对数）· Y：综合参考分</span>
        <span className="flex gap-3">
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-open inline-block" />开源</span>
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-closed inline-block" />闭源</span>
          <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border-2 border-open inline-block" />空心 = 第三方托管价</span>
        </span>
      </div>
      <div className="h-[300px] md:h-[360px]">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" scale="log" domain={[0.04, 30]} ticks={[0.05, 0.1, 0.3, 1, 3, 10, 30]} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} stroke="var(--border)" />
            <YAxis type="number" dataKey="y" domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--border)" width={32} />
            <ZAxis range={[60, 60]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
              const p = payload?.[0]?.payload as { name: string; x: number; y: number } | undefined
              if (!p) return null
              return <div className="card px-3 py-2 text-xs shadow-lg"><div className="font-medium">{p.name}</div><div className="num text-muted">${p.x} · 参考分 {p.y.toFixed(1)}</div></div>
            }} />
            <Scatter data={openPts} shape={dot('var(--open)')} isAnimationActive={false} />
            <Scatter data={closedPts} shape={dot('var(--closed)')} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
