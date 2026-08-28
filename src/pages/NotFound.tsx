import { Empty, Button } from '@/components/ui/Misc'
import { useT } from '@/i18n'
export default function NotFound() {
  const { t } = useT()
  return <Empty text={t('页面不存在')} action={<Button to="/" variant="outline">{t('回首页')}</Button>} />
}
