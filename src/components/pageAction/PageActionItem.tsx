import { X, Pencil } from 'lucide-react'
import { cn, capitalize } from '@/lib/utils'
import type { PageActionStep } from '@/types'

type Props = {
  step: PageActionStep
  currentId: string | undefined
  failedId: string | undefined
  failedMessage: string | undefined
  onDelete: (id: string) => void
  onClickEdit: (id: string) => void
}

export function PageActionItem(props: Props): JSX.Element {
  const { step, currentId, failedId, failedMessage } = props
  const isInput = step.type === 'input'
  const isFailed = failedId === step.id

  return (
    <li
      className={cn(
        'relative bg-blue-200 rounded-xl p-1.5 text-center',
        currentId === step.id ? 'bg-green-200' : '',
        isFailed ? 'bg-red-200' : '',
      )}
      key={step.id}
    >
      <p className="text-sm text-stone-600 font-medium">
        {capitalize(step.type)}
      </p>
      <p className="truncate w-20 text-xs text-stone-600">{`${step.param.label}`}</p>
      {isFailed && (
        <p className="absolute bottom-[-40px] text-xs leading-3 text-red-600">
          {failedMessage}
        </p>
      )}
      {isInput && (
        <button
          className="absolute top-[-4px] right-[18px] bg-white rounded-full p-[3px] border border-stone-300"
          onClick={() => props.onClickEdit(step.id)}
        >
          <Pencil
            size={12}
            className="fill-white stroke-stone-500 pointer-events-auto"
          />
        </button>
      )}
      <button
        className={cn(
          'absolute top-[-4px] right-[-4px] bg-white rounded-full p-0.5 border border-stone-300',
        )}
        onClick={() => props.onDelete(step.id)}
      >
        <X
          size={14}
          className="fill-white stroke-stone-500 pointer-events-auto"
        />
      </button>
    </li>
  )
}
