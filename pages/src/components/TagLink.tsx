import Link from 'next/link'
import { Tag } from '@/components/Tag'
import { Tag as TagType } from '@/types'
import { useLocale } from '@/hooks/useLocale'

type Props = {
  tag: TagType
}

export function TagLink(props: Props): JSX.Element {
  const { tag } = props
  const { lang } = useLocale()
  return (
    <Link href={`/${lang}/tag/${tag.name}`}>
      <Tag tag={tag} />
    </Link>
  )
}
