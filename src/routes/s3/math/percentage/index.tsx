import { createFileRoute } from '@tanstack/react-router'
import PercentagePage from '@/math/s3/percentage/PercentagePage'

export const Route = createFileRoute('/s3/math/percentage/')({
  component: PercentagePage,
})
