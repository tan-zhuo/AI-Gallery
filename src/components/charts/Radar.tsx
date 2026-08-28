import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts'

export interface RadarPoint { axis: string; value?: number }

export function CapabilityRadar({ data, color = 'var(--accent)', series }: { data: RadarPoint[]; color?: string; series?: Array<{ name: string; color: string; data: RadarPoint[] }> }) {
  const axes = data.filter((d) => d.value != null)
  if (axes.length < 3 && !series) return <div className="text-xs text-muted h-full grid place-items-center">可用维度不足 3 个，不绘制雷达图</div>
  const merged = (series ? series[0].data : axes).map((d, i) => {
    const o: Record<string, number | string> = { axis: d.axis }
    if (series) series.forEach((s) => { o[s.name] = s.data[i]?.value ?? 0 })
    else o.v = d.value ?? 0
    return o
  })
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={merged} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {series ? series.map((s) => <Radar key={s.name} name={s.name} dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.12} isAnimationActive={false} />)
          : <Radar dataKey="v" stroke={color} fill={color} fillOpacity={0.18} isAnimationActive={false} />}
      </RadarChart>
    </ResponsiveContainer>
  )
}
