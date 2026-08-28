import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '@/hooks/useLocalStorage'
import { meta } from '@/lib/catalog'
import { cx } from '@/lib/format'
import { SearchPalette } from './SearchPalette'
import { Logo, LogoMark, Wordmark } from './ui/Logo'

const nav = [
  ['/leaderboard', '排行榜'], ['/models', '模型库'], ['/compare', '对比'], ['/calculator', '计算器'], ['/architecture', '架构图鉴'], ['/methodology', '方法论'],
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
            <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-text" aria-label="搜索模型">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <span className="hidden sm:inline">搜索模型</span>
              <kbd className="hidden sm:inline num text-[10px] rounded border border-border px-1">⌘K</kbd>
            </button>
            <button type="button" onClick={toggle} aria-label={dark ? '切换到浅色' : '切换到深色'} className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-surface-2">
              {dark ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
            </button>
            <button type="button" onClick={() => setMenu((m) => !m)} className="md:hidden grid h-8 w-8 place-items-center rounded-lg border border-border" aria-label="菜单" aria-expanded={menu}>
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
      <footer className="border-t border-border mt-10">
        <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2"><LogoMark size={22} /><Wordmark className="text-base" /></div>
            <p className="text-xs text-muted max-w-md">给工程师和选型者的模型决策站：排行榜当入口，说明书当核心资产。纯静态站点，数据全部来自仓库内 JSON。</p>
          </div>
          <div className="text-xs text-muted flex flex-col gap-2 md:items-end">
          <div>数据更新 <span className="num text-text">{meta.generated_at}</span> · 数据截止 <span className="num">{meta.data_cutoff}</span> · 价格 USD / 百万 token，不换算汇率</div>
          <div className="flex gap-4">
            <Link to="/methodology" className="hover:text-text">方法论</Link>
            <Link to="/changelog" className="hover:text-text">更新日志</Link>
            <Link to="/about" className="hover:text-text">关于 / 来源声明</Link>
          </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-6 text-[11px] text-muted border-t border-border/60 pt-4">排名供选型参考，基准会饱和、会泄漏、会过时。所有规格以官方来源为准；闭源参数量一律「未披露」。</div>
      </footer>
      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
