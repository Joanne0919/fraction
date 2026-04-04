import { createFileRoute } from '@tanstack/react-router'
import DecimalPage from '@/math/s3/decimal/DecimalPage'

export const Route = createFileRoute('/s3/math/decimal/')({
  component: DecimalPage,
})
