import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TOPICS } from '@/content/architecture'
import { Empty, Button } from '@/components/ui/Misc'
import { useSeo } from '@/hooks/useSeo'
import { useT } from '@/i18n'


export default function Architecture() {
  const { topic } = useParams()
  const { t, lang } = useT()
  const cur = TOPICS.find((x) => x.slug === topic)
  useSeo({ title: cur ? cur.title[lang] : t('架构图鉴'), description: cur ? cur.summary[lang] : t('MoE、GQA / MLA、KV Cache、量化、推理模型、开源许可证——理解模型说明书里的术语。'), path: cur ? `/architecture/${cur.slug}` : '/architecture' })
  if (topic) {
    if (!cur) return <Empty text={t('没有这个概念页')} action={<Button to="/architecture" variant="outline">{t('返回图鉴')}</Button>} />
    return (
      <article className="max-w-3xl space-y-4">
        <Link to="/architecture" className="text-xs link">← {t('架构图鉴')}</Link>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{cur.title[lang]}</h1>
        <p className="text-muted">{cur.summary[lang]}</p>
        <div className="md text-sm md:text-[15px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{cur.body[lang]}</ReactMarkdown></div>
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">{TOPICS.filter((x) => x.slug !== cur.slug).map((x) => <Link key={x.slug} to={`/architecture/${x.slug}`} className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2">{x.title[lang]}</Link>)}</div>
      </article>
    )
  }
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold tracking-tight">{t('架构图鉴')}</h1><p className="text-xs text-muted mt-1">{t('解释详情页里出现的术语，统一图例：实线 = 已公开，虚线 = 未披露。')}</p></div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((x, i) => <Link key={x.slug} to={`/architecture/${x.slug}`} className="card card-hover p-5"><div className="num text-[11px] text-muted">0{i + 1}</div><div className="font-semibold mt-1">{x.title[lang]}</div><p className="text-sm text-muted mt-2 leading-relaxed">{x.summary[lang]}</p></Link>)}
      </div>
    </div>
  )
}
