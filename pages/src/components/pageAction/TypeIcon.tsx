import { PAGE_ACTION_EVENT, PAGE_ACTION_CONTROL } from '@/const'
import {
  ArrowDownFromLine,
  ArrowDownToLine,
  MousePointerClick,
  Keyboard,
  Type,
  Mouse,
  CircleHelp,
} from 'lucide-react'

export const TypeIcon = ({
  type,
  className,
  size = 16,
}: {
  type: PAGE_ACTION_EVENT | PAGE_ACTION_CONTROL
  size?: number
  className?: string
}) => {
  switch (type) {
    case 'start':
      return <ArrowDownFromLine size={size} className={className} />
    case 'end':
      return <ArrowDownToLine size={size} className={className} />
    case 'click':
    case 'doubleClick':
    case 'tripleClick':
      return <MousePointerClick size={size} className={className} />
    case 'keyboard':
      return <Keyboard size={size} className={className} />
    case 'input':
      return <Type size={size} className={className} />
    case 'scroll':
      return <Mouse size={size} className={className} />
    default:
      return <CircleHelp size={size} className={className} />
  }
}
