import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useLocalStorage'
import { meta } from '@/lib/catalog'
import { cx } from '@/lib/format'
import { SearchPalette } from './SearchPalette'
import { Logo, LogoMark, Wordmark } from './ui/Logo'

const nav = [
  ['/leaderboard', '排行榜'], ['/models', '模型库'], ['/compare', '对比'], ['/calculator', '计算器'], ['/hardware', '显卡'], ['/architecture', '架构图鉴'], ['/methodology', '方法论'],
]

export default function Layout() {
  const [dark, toggle] = useTheme()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const loc = useLocation()
  useEffect(() => { setMenu(false); window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center" aria-label="AI-Gallery 首页"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-0.5 ml-4">
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => cx('rounded-full px-3 py-1.5 text-[13px] font-medium transition', isActive ? 'bg-surface-2 text-text shadow-[inset_0_0_0_1px_var(--border)]' : 'text-muted hover:text-text hover:bg-surface-2/60')}>{label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setOpen(true)} className="ctl text-muted hover:text-text" aria-label="搜索模型">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <span className="hidden sm:inline">搜索模型</span>
              <kbd className="hidden sm:inline num text-[10px] rounded border border-border px-1">⌘K</kbd>
            </button>
            <button type="button" onClick={toggle} aria-label={dark ? '切换到浅色' : '切换到深色'} className="ctl w-9 justify-center px-0 hover:bg-surface-2">
              {dark ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
            </button>
            <button type="button" onClick={() => setMenu((m) => !m)} className="md:hidden ctl w-9 justify-center px-0" aria-label="菜单" aria-expanded={menu}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
          </div>
        </div>
        {menu && (
          <nav className="md:hidden border-t border-border bg-bg px-4 py-2 grid grid-cols-2 gap-1">
            {nav.map(([to, label]) => <NavLink key={to} to={to} className="rounded-md px-2.5 py-2 text-sm hover:bg-surface-2">{label}</NavLink>)}
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">
        <Outlet />
      </main>
      <footer className="mt-16 border-t border-border bg-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5"><LogoMark size={26} /><Wordmark className="text-lg" /></div>
            <p className="text-sm text-muted leading-relaxed max-w-sm">给工程师和选型者的模型决策站。排行榜当入口，说明书当核心资产；显存、价格与证据等级是一等公民。</p>
            <div className="flex items-center gap-3 text-xs text-muted">
              <a href={meta.repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-text"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>GitHub</a>
              <span aria-hidden>·</span>
              <a href={meta.author_url} target="_blank" rel="noreferrer" className="hover:text-text">博客 tanzhuo.xyz</a>
              <span aria-hidden>·</span>
              <span>纯静态站 · 无后端</span>
              <span aria-hidden>·</span>
              <span className="num">v{meta.version}</span>
            </div>
          </div>
          <div>
            <div className="eyebrow mb-3">浏览</div>
            <ul className="space-y-2 text-sm">
              {[['/leaderboard', '排行榜'], ['/models', '模型库'], ['/compare', '对比台'], ['/calculator', '显存 / 成本计算器'], ['/hardware', '我的显卡能跑谁']].map(([to, l]) => <li key={to}><Link to={to} className="text-muted hover:text-text">{l}</Link></li>)}
            </ul>
          </div>
          <div>
            <div className="eyebrow mb-3">资料</div>
            <ul className="space-y-2 text-sm">
              {[['/architecture', '架构图鉴'], ['/methodology', '方法论'], ['/changelog', '更新日志'], ['/about', '关于 / 来源声明']].map(([to, l]) => <li key={to}><Link to={to} className="text-muted hover:text-text">{l}</Link></li>)}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="eyebrow">数据</div>
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between gap-3"><dt className="text-muted">站点构建</dt><dd className="num">{meta.generated_at}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">数据截止</dt><dd className="num">{meta.data_cutoff}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">价格单位</dt><dd className="num">USD / 1M tok</dd></div>
            </dl>
            <div className="text-xs text-muted leading-relaxed">来源：官方模型卡与定价页、LMArena、Artificial Analysis、Hugging Face 配置文件。</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              <span className="text-official">○ 厂商公布</span><span className="text-independent">● 独立复测</span><span className="text-community">◐ 社区 / 估计</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col md:flex-row gap-2 md:items-center justify-between text-[11px] text-muted">
            <span>排名供选型参考，基准会饱和、会泄漏、会过时。所有规格以官方来源为准；闭源参数量一律「未披露」。</span>
            <span>© 2026 <a href={meta.author_url} target="_blank" rel="noreferrer" className="hover:text-text">{meta.author}</a> · <a href={meta.repo_url} target="_blank" rel="noreferrer" className="hover:text-text">开源 MIT</a> · 模型名称与 logo 归各厂商所有</span>
          </div>
        </div>
      </footer>
      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
