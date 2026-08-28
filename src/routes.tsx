import type { RouteObject } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Leaderboard from './pages/Leaderboard'
import Models from './pages/Models'
import ModelDetail from './pages/ModelDetail'
import Compare from './pages/Compare'
import Calculator from './pages/Calculator'
import Hardware from './pages/Hardware'
import Architecture from './pages/Architecture'
import Methodology from './pages/Methodology'
import Changelog from './pages/Changelog'
import About from './pages/About'
import NotFound from './pages/NotFound'

export const routes: RouteObject[] = [{
  path: '/', element: <Layout />, children: [
    { index: true, element: <Home /> },
    { path: 'leaderboard', element: <Leaderboard /> },
    { path: 'leaderboard/:scene', element: <Leaderboard /> },
    { path: 'models', element: <Models /> },
    { path: 'models/:slug', element: <ModelDetail /> },
    { path: 'compare', element: <Compare /> },
    { path: 'calculator', element: <Calculator /> },
    { path: 'hardware', element: <Hardware /> },
    { path: 'architecture', element: <Architecture /> },
    { path: 'architecture/:topic', element: <Architecture /> },
    { path: 'methodology', element: <Methodology /> },
    { path: 'changelog', element: <Changelog /> },
    { path: 'about', element: <About /> },
    { path: '*', element: <NotFound /> },
  ],
}]
