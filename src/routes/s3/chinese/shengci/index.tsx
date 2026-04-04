import { createFileRoute } from '@tanstack/react-router'
import ShengciGame from '../../../../chinese/s3/shengci/ShengciGame'

export const Route = createFileRoute('/s3/chinese/shengci/')({
  component: ShengciGame,
})
