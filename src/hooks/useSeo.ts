import { useEffect } from 'react'
import { meta } from '@/lib/catalog'

const SITE = 'AI-Gallery'
const isServer = typeof document === 'undefined'

export interface SeoState { title: string; description: string; url: string; jsonLd?: Record<string, unknown> }
let serverSeo: SeoState | undefined
let serverPath = '/'
/** 预渲染前设置当前路径，供未显式传 path 的页面生成 canonical */
export function setServerPath(p: string) { serverPath = p }
/** 预渲染脚本在 renderToString 后取走本页 SEO 状态 */
export function takeSeo() { const s = serverSeo; serverSeo = undefined; return s }

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.content = content
}

function fullTitle(title: string) { return title === SITE ? `${SITE} · AI 模型排行与说明书` : `${title} · ${SITE}` }
function canonical(path?: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const p = path ?? (isServer ? serverPath : location.pathname.replace(base, ''))
  return `${meta.site_url.replace(/\/$/, '')}${p}`
}

/** SPA 内的每页 SEO：标题、描述、canonical、Open Graph、可选 JSON-LD。服务端渲染时记录到 serverSeo。 */
export function useSeo(opts: { title: string; description: string; path?: string; jsonLd?: Record<string, unknown> }) {
  if (isServer) serverSeo = { title: fullTitle(opts.title), description: opts.description, url: canonical(opts.path), jsonLd: opts.jsonLd }
  useEffect(() => {
    const title = fullTitle(opts.title)
    document.title = title
    setMeta('name', 'description', opts.description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', opts.description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', SITE)
    setMeta('name', 'twitter:card', 'summary')
    const url = canonical(opts.path)
    setMeta('property', 'og:url', url)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = url
    let ld = document.getElementById('ld-page') as HTMLScriptElement | null
    if (opts.jsonLd) {
      if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'ld-page'; document.head.appendChild(ld) }
      ld.textContent = JSON.stringify(opts.jsonLd)
    } else ld?.remove()
  }, [opts.title, opts.description, opts.path, opts.jsonLd])
}
