import { createFileRoute } from '@tanstack/react-router'
import FractionPage from '../../../../math/s3/fraction/FractionPage'

export const Route = createFileRoute('/s3/math/fraction/')({
  component: FractionPage,
})
