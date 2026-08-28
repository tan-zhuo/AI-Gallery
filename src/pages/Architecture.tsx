import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TOPICS } from '@/content/architecture'
import { Empty, Button } from '@/components/ui/Misc'

export default function Architecture() {
  const { topic } = useParams()
  if (topic) {
    const t = TOPICS.find((x) => x.slug === topic)
    if (!t) return <Empty text="没有这个概念页" action={<Button to="/architecture" variant="outline">返回图鉴</Button>} />
    return (
      <article className="max-w-3xl space-y-4">
        <Link to="/architecture" className="text-xs link">← 架构图鉴</Link>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-muted">{t.summary}</p>
        <div className="md text-sm md:text-[15px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{t.body}</ReactMarkdown></div>
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">{TOPICS.filter((x) => x.slug !== t.slug).map((x) => <Link key={x.slug} to={`/architecture/${x.slug}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2">{x.title}</Link>)}</div>
      </article>
    )
  }
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">架构图鉴</h1><p className="text-xs text-muted mt-1">解释详情页里出现的术语，统一图例：实线 = 已公开，虚线 = 未披露。</p></div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t, i) => <Link key={t.slug} to={`/architecture/${t.slug}`} className="card card-hover p-5"><div className="num text-[11px] text-muted">0{i + 1}</div><div className="font-semibold mt-1">{t.title}</div><p className="text-sm text-muted mt-2 leading-relaxed">{t.summary}</p></Link>)}
      </div>
    </div>
  )
}
