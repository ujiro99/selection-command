import type {
  InferGetStaticPropsType,
  GetStaticProps,
  GetStaticPaths,
} from 'next'
import { getTags } from '@/features/tag'
import Tags from '@/data/tags.json'

type Tag = {
  name: string
  count: number
}

export const getStaticPaths = (async () => {
  const tags = getTags()

  const paths = tags.map((tag) => ({
    params: {
      name: tag.name,
    },
  }))

  return {
    paths,
    fallback: false,
  }
}) satisfies GetStaticPaths

export const getStaticProps = (async ({ params }) => {
  if (!params) {
    return { props: { tag: { name: '', count: 0 } } }
  }
  const tag = Tags.find((tag) => tag.name === params.name) as Tag
  return { props: { tag: tag } }
}) satisfies GetStaticProps<{
  tag: Tag
}>

export default function Page({
  tag,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return tag.count
}
