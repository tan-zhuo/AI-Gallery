import { Link } from 'react-router-dom'
import { changelog } from '@/lib/catalog'
import { cx } from '@/lib/format'

export default function Changelog() {
  const groups = changelog.reduce<Record<string, typeof changelog>>((acc, c) => { (acc[c.date] ??= []).push(c); return acc }, {})
  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">更新日志</h1><p className="text-xs text-muted mt-1">新模型、分数变动、文档修订。</p></div>
      {Object.entries(groups).map(([d, items]) => (
        <section key={d} className="grid gap-2 md:grid-cols-[120px_1fr]">
          <div className="num text-sm text-muted">{d}</div>
          <ul className="card divide-y divide-border">
            {items.map((c, i) => (
              <li key={i} className="flex gap-3 px-4 py-2.5 text-sm">
                <span className={cx('num text-[10px] mt-1 w-8 shrink-0 font-semibold', c.type === 'up' ? 'text-up' : c.type === 'down' ? 'text-down' : c.type === 'new' ? 'text-accent' : 'text-muted')}>{{ up: '↑', down: '↓', new: 'NEW', doc: 'DOC', score: 'SCR' }[c.type]}</span>
                <span>{c.model_id ? <Link to={`/models/${c.model_id}`} className="hover:underline">{c.text}</Link> : c.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
