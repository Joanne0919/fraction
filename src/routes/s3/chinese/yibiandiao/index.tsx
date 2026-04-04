import { createFileRoute } from '@tanstack/react-router'
import YiBiandiao from '@/chinese/s3/yibiandiao/YiBiandiao'

export const Route = createFileRoute('/s3/chinese/yibiandiao/')({
  component: YiBiandiao,
})
