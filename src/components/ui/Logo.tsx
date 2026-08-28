/** AI-Gallery 品牌标志：神经网络节点星座（中心节点 + 六向连接），渐变描边 */
function Mark({ size, id }: { size: number; id: string }) {
  const g = `lg-${id}`
  const pts = [0, 60, 120, 180, 240, 300].map((deg) => {
    const r = (deg * Math.PI) / 180
    return [16 + 9.5 * Math.cos(r), 16 + 9.5 * Math.sin(r)] as const
  })
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b9cff" /><stop offset="1" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--logo-bg, #0f1117)" />
      {/* 连线：中心到外环 + 外环相邻 */}
      <g stroke={`url(#${g})`} strokeWidth="1.1" strokeLinecap="round" opacity=".7">
        {pts.map(([x, y], i) => <line key={`c${i}`} x1="16" y1="16" x2={x} y2={y} />)}
        {pts.map(([x, y], i) => { const [nx, ny] = pts[(i + 1) % 6]; return <line key={`r${i}`} x1={x} y1={y} x2={nx} y2={ny} /> })}
      </g>
      {/* 外环节点 */}
      {pts.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r="2" fill={`url(#${g})`} opacity={i % 2 ? 0.85 : 1} />)}
      {/* 中心节点 */}
      <circle cx="16" cy="16" r="3.4" fill={`url(#${g})`} />
      <circle cx="16" cy="16" r="1.3" fill="var(--logo-bg, #0f1117)" />
    </svg>
  )
}

export function LogoMark({ size = 28 }: { size?: number }) { return <Mark size={size} id={String(size)} /> }

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span className="bg-gradient-to-r from-[#8b9cff] to-[#5eead4] bg-clip-text text-transparent">AI</span>
      <span className="text-muted mx-px">-</span>Gallery
    </span>
  )
}

export function Logo({ size = 28, tagline }: { size?: number; tagline?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="leading-none">
        <Wordmark className="text-[17px]" />
        {tagline && <span className="block text-[10px] text-muted tracking-widest mt-1 uppercase">Model Leaderboard & Specs</span>}
      </span>
    </span>
  )
}
