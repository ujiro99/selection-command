import { DynamicIcon } from 'lucide-react/dynamic'
import { PAGE_ACTION_EVENT, PAGE_ACTION_CONTROL } from '@/const'
import { actionToLucide } from '@/lib/utils'

export const TypeIcon = ({
  type,
  className,
  size = 16,
}: {
  type: PAGE_ACTION_EVENT | PAGE_ACTION_CONTROL
  size?: number
  className?: string
}) => {
  return (
    <DynamicIcon
      className={className}
      size={size}
      name={actionToLucide(type)}
    />
  )
}
