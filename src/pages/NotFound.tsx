import { Empty, Button } from '@/components/ui/Misc'
export default function NotFound() {
  return <Empty text="页面不存在" action={<Button to="/" variant="outline">回首页</Button>} />
}
