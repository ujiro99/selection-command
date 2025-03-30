import { cn, onHover } from '@/lib/utils'
import { PageActionItem } from '@/components/pageAction/PageActionItem'
import { CircleDashed } from 'lucide-react'
import type { PageActionStep } from '@/types'

import { PAGE_ACTION_MAX, PAGE_ACTION_CONTROL } from '@/const'
import { e2a } from '@/lib/utils'

const noop = () => {}

type Props = {
  steps: PageActionStep[]
  currentId?: string
  failedId?: string
  failedMessage?: string
  onClickRemove?: (id: string) => void
  onClickEdit?: (id: string) => void
  onChangeHover?: (hover: boolean) => void
}

export function StepList(props: Props): JSX.Element {
  const { steps: _steps, currentId, failedId, failedMessage } = props
  const steps = _steps.filter(
    (f) => !e2a(PAGE_ACTION_CONTROL).includes(f.param.type),
  )
  const emptySteps = [...Array(PAGE_ACTION_MAX - 2 - steps.length)]

  const onChangeHover = props.onChangeHover ?? noop
  const onClickRemove = props.onClickRemove ?? noop
  const onClickEdit = props.onClickEdit ?? noop

  return (
    <ol className="flex items-center h-full" {...onHover(onChangeHover, true)}>
      {steps.map((step, i) => (
        <PageActionItem
          key={step.id}
          step={step}
          currentId={currentId}
          failedId={failedId}
          failedMessage={failedMessage}
          onClickRemove={onClickRemove}
          onClickEdit={onClickEdit}
          className={cn(
            'relative',
            i > 0 &&
              "after:content-[''] after:z-[-1] after:absolute after:left-[-25%] after:h-[2px] after:w-[50%] after:bg-gray-500/80 after:rounded",
          )}
        />
      ))}
      {emptySteps.map((_, i) => (
        <li
          key={i}
          className={cn(
            'h-[24px] flex-1 flex items-center justify-center relative',
            (steps.length > 0 || i > 0) &&
              "after:content-[''] after:z-[-1] after:absolute after:left-[-25%] after:h-[2px] after:w-[50%] after:bg-gray-400/70 after:rounded",
          )}
        >
          <div className="bg-gray-50 rounded-full h-fit w-fit">
            <CircleDashed
              size="12"
              strokeWidth={3}
              className="stroke-gray-400"
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
