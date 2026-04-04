import { createFileRoute } from '@tanstack/react-router'
import ChinesePage from '../../../chinese/s3/ChinesePage'

export const Route = createFileRoute('/s3/chinese/')({
  component: ChinesePage,
})
