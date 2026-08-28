// 构建期预渲染入口：把每个路由渲染成静态 HTML（SEO 用）；客户端仍以 createRoot 接管。
import { renderToString } from 'react-dom/server'
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router-dom'
import { LangProvider } from './i18n'
import { routes } from './routes'
import { takeSeo, setServerPath } from './hooks/useSeo'

export async function render(path: string): Promise<{ html: string; seo: ReturnType<typeof takeSeo> }> {
  setServerPath(path)
  const handler = createStaticHandler(routes)
  const ctx = await handler.query(new Request(`http://prerender.local${path}`))
  if (ctx instanceof Response) throw new Error(`redirect for ${path}`)
  const router = createStaticRouter(handler.dataRoutes, ctx)
  const html = renderToString(<LangProvider><StaticRouterProvider router={router} context={ctx} /></LangProvider>)
  return { html, seo: takeSeo() }
}
