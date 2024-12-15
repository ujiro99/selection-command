import { getTags } from '@/features/tag'

type Tag = {
  name: string
  count: number
}

export function generateStaticParams() {
  const tags = getTags()
  const paths = tags.map((tag) => ({ name: tag.name }))
  return paths
}

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  return <div>{name}</div>
}
