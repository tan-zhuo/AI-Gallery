import { Link } from 'react-router-dom'
import type { Model } from '@/lib/types'
import { pickConfigs, fmtTok, fmtCtx, TIER_LABEL, type ConfigOption } from '@/lib/perf'
import { QUANT_LABEL } from '@/lib/vram'
import { formatGB, cx } from '@/lib/format'
import { useT } from '@/i18n'

function Pick({ title, c, tone }: { title: string; c?: ConfigOption; tone: 'open' | 'accent' }) {
  const { t } = useT()
  return (
    <div className={cx('rounded-xl border p-4', tone === 'open' ? 'border-open/40 bg-[var(--open-bg)]' : 'border-accent/40 bg-accent/10')}>
      <div className="eyebrow">{title}</div>
      {!c ? <div className="mt-2 text-sm text-muted">{t('在本站硬件表内无可行配置（需多节点或权重未知）')}</div> : (
        <>
          <div className="mt-1.5 text-lg font-semibold leading-tight">{c.est.count > 1 ? `${c.est.count} × ` : ''}{c.est.gpu.name}</div>
          <div className="text-xs text-muted">{c.est.gpu.price_hint}{c.est.count > 1 ? ` × ${c.est.count}` : ''} · {t('合计')} ≈¥{(c.est.gpu.price_cny * c.est.count).toLocaleString()} · {t(TIER_LABEL[c.est.gpu.tier])}</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div><div className="text-muted">{t('量化')}</div><div className="num font-medium">{QUANT_LABEL[c.est.quant]}</div></div>
            <div><div className="text-muted">{t('解码')}</div><div className="num font-medium">{fmtTok(c.est.decode_tok_s)} tok/s</div></div>
            <div><div className="text-muted">{t('最大上下文')}</div><div className="num font-medium">{c.est.kv_modeled ? fmtCtx(c.est.max_context) : t('未建模')}</div></div>
          </div>
        </>
      )}
    </div>
  )
}

export function DeploySection({ m }: { m: Model }) {
  const { t } = useT()
  const { minimal, recommended, all } = pickConfigs(m)
  if (!m.weights_available) return <p className="text-sm text-muted">{t('闭源模型无自建选项；吞吐取决于官方 API。')}</p>
  if (all.length === 0) return <p className="text-sm text-muted">{t('参数量未知或超出本站硬件表（> 8×B200），无法给出配置。')}</p>
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Pick title={t('最低可跑（8K 上下文）')} c={minimal} tone="open" />
        <Pick title={t('推荐配置（≥Q8 · 32K 上下文 · ≥15 tok/s）')} c={recommended} tone="accent" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr className="border-b border-border"><th className="text-left py-1.5 pr-3">{t('配置')}</th><th className="text-left py-1.5 pr-3">{t('量化')}</th><th className="text-right py-1.5 pr-3">{t('占用 / 显存')}</th><th className="text-right py-1.5 pr-3">{t('解码 tok/s')}</th><th className="text-right py-1.5 pr-3">{t('预填充 tok/s')}</th><th className="text-right py-1.5">{t('最大上下文')}</th></tr>
          </thead>
          <tbody>
            {all.map((c) => (
              <tr key={c.est.gpu.id} className={cx('border-b border-border/60', c === recommended && 'bg-accent/5')}>
                <td className="py-1.5 pr-3">{c.est.count > 1 && <span className="num">{c.est.count}× </span>}{c.est.gpu.name}<span className="ml-2 text-[10px] text-muted">{t(TIER_LABEL[c.est.gpu.tier])}</span></td>
                <td className="py-1.5 pr-3 num">{QUANT_LABEL[c.est.quant]}{c.est.estimated_weight && <span className="text-[10px] text-community ml-1">{t('估')}</span>}</td>
                <td className="py-1.5 pr-3 num text-right">{formatGB(c.est.total_gb)} / {c.est.vram_gb} GB</td>
                <td className="py-1.5 pr-3 num text-right font-medium">{fmtTok(c.est.decode_tok_s)}</td>
                <td className="py-1.5 pr-3 num text-right text-muted">{fmtTok(c.est.prefill_tok_s)}</td>
                <td className="py-1.5 num text-right">{c.est.kv_modeled ? fmtCtx(c.est.max_context) : <span className="text-community">{t('未建模')}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">{t('单流（batch=1）估算：解码 ≈ 显存带宽 × 效率 ÷ 每 token 读取字节（激活参数 × 量化位宽 + KV）；预填充 ≈ FP16 算力 × 0.45 ÷ (2 × 激活参数)。多卡按张量并行、带宽求和 × 0.55。实际受引擎、驱动、PCIe 影响，误差 ±30%。')}<Link to="/hardware" className="link">{t('反向查：我的卡能跑谁 →')}</Link></p>
    </div>
  )
}
