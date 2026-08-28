/** AI-Gallery 品牌标志：画廊框 + 三块渐变「展板」（同时是排行的柱状隐喻） */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b9cff" /><stop offset="1" stopColor="#5eead4" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="var(--logo-bg, #0f1117)" stroke="url(#lg-a)" strokeWidth="1.5" />
      <rect x="7" y="17" width="4.5" height="8" rx="1.2" fill="url(#lg-a)" opacity=".55" />
      <rect x="13.75" y="12" width="4.5" height="13" rx="1.2" fill="url(#lg-a)" opacity=".8" />
      <rect x="20.5" y="7" width="4.5" height="18" rx="1.2" fill="url(#lg-a)" />
    </svg>
  )
}

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
