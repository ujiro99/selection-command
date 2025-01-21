import { cn, capitalizeFirst } from '@/lib/utils'
import { PageActionType } from '@/types'
import { X } from 'lucide-react'

type Props = {
  action: PageActionType
  currentId: string | undefined
  failedId: string | undefined
  failedMessage: string | undefined
  onDeleted: (id: string) => void
}

export function PageActionItem(props: Props): JSX.Element {
  const { action, currentId, failedId, failedMessage } = props
  const isFailed = failedId === action.id

  return (
    <li
      className={cn(
        'relative bg-blue-200 rounded-xl p-1.5 text-center',
        currentId === action.id ? 'bg-green-200' : '',
        isFailed ? 'bg-red-200' : '',
      )}
      key={action.timestamp}
    >
      <p className="text-sm text-stone-600 font-medium">
        {capitalizeFirst(action.type)}
      </p>
      <p className="truncate w-20 text-xs text-stone-600">{`${action.params.label}`}</p>
      {isFailed && (
        <p className="absolute bottom-[-40px] text-xs leading-3 text-red-600">
          {failedMessage}
        </p>
      )}
      <button
        className={cn(
          'absolute top-[-4px] right-[-4px] bg-white rounded-full p-0.5 border border-stone-300',
        )}
        onClick={() => props.onDeleted(action.id)}
      >
        <X
          size={14}
          className="fill-white stroke-stone-500 pointer-events-auto"
        />
      </button>
    </li>
  )
}
