import { createFileRoute } from '@tanstack/react-router'
import ChouBeiGame from '../../../../chinese/s3/choubei/ChouBeiGame'

export const Route = createFileRoute('/s3/chinese/choubei/')({
  component: ChouBeiGame,
})
