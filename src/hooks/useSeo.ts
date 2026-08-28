import { useEffect } from 'react'
import { meta } from '@/lib/catalog'

const SITE = 'AI-Gallery'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.content = content
}

/** SPA 内的每页 SEO：标题、描述、canonical、Open Graph、可选 JSON-LD */
export function useSeo(opts: { title: string; description: string; path?: string; jsonLd?: Record<string, unknown> }) {
  useEffect(() => {
    const title = opts.title === SITE ? `${SITE} · AI 模型排行与说明书` : `${opts.title} · ${SITE}`
    document.title = title
    setMeta('name', 'description', opts.description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', opts.description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', SITE)
    setMeta('name', 'twitter:card', 'summary')
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    const url = `${meta.site_url.replace(/\/$/, '')}${opts.path ?? location.pathname.replace(base, '')}`
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
