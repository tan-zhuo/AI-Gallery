import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/index.css'
import { LangProvider } from './i18n'
import { routes } from './routes'

// 主题初始化（localStorage 缺失时用默认深色）
try {
  const t = localStorage.getItem('mb_theme')
  document.documentElement.classList.toggle('dark', t ? t === 'dark' : true)
} catch { document.documentElement.classList.add('dark') }

// 404.html 回退（GitHub Pages 等）
let initial: string | undefined
try {
  const r = sessionStorage.getItem('mb_redirect')
  if (r) { sessionStorage.removeItem('mb_redirect'); initial = r }
} catch { /* noop */ }
if (initial) history.replaceState(null, '', initial)

const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || undefined })

createRoot(document.getElementById('root')!).render(
  <StrictMode><LangProvider><RouterProvider router={router} /></LangProvider></StrictMode>,
)
