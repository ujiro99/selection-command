import { Badge } from '@/components/ui/badge'
import clsx from 'clsx'

import type { Tag } from '@/types'

type Props = {
  tag: Tag
  className?: string
}
export function Tag(props: Props): JSX.Element {
  return (
    <Badge
      className={clsx(
        'bg-stone-200 hover:bg-stone-300 text-stone-800 select-none',
        props.className,
      )}
    >
      {props.tag.name}
    </Badge>
  )
}
