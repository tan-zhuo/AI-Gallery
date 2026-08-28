import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/index.css'
import Layout from './components/Layout'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import Models from './pages/Models'
import ModelDetail from './pages/ModelDetail'
import Compare from './pages/Compare'
import Calculator from './pages/Calculator'
import Architecture from './pages/Architecture'
import Methodology from './pages/Methodology'
import Changelog from './pages/Changelog'
import About from './pages/About'
import NotFound from './pages/NotFound'

// 主题初始化（localStorage 缺失时用系统偏好；默认深色）
try {
  const t = localStorage.getItem('mb_theme')
  const dark = t ? t === 'dark' : true
  document.documentElement.classList.toggle('dark', dark)
} catch { document.documentElement.classList.add('dark') }

// 404.html 回退（GitHub Pages 等）
let initial: string | undefined
try {
  const r = sessionStorage.getItem('mb_redirect')
  if (r) { sessionStorage.removeItem('mb_redirect'); initial = r }
} catch { /* noop */ }
if (initial) history.replaceState(null, '', initial)

const router = createBrowserRouter(
  [{
    path: '/', element: <Layout />, children: [
      { index: true, element: <Home /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'leaderboard/:scene', element: <Leaderboard /> },
      { path: 'models', element: <Models /> },
      { path: 'models/:slug', element: <ModelDetail /> },
      { path: 'compare', element: <Compare /> },
      { path: 'calculator', element: <Calculator /> },
      { path: 'architecture', element: <Architecture /> },
      { path: 'architecture/:topic', element: <Architecture /> },
      { path: 'methodology', element: <Methodology /> },
      { path: 'changelog', element: <Changelog /> },
      { path: 'about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  }],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || undefined },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>,
)
