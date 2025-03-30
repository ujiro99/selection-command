import { cn } from '@/lib/utils'
import { PageActionItem } from '@/components/pageAction/PageActionItem'
import { CircleDashed } from 'lucide-react'
import type { PageActionStep } from '@/types/pageAction'
import { PAGE_ACTION_CONTROL } from '@/const'

import { PAGE_ACTION_MAX } from '@/const'

type Props = {
  steps: PageActionStep[]
  className?: string
}

export function StepList(props: Props): JSX.Element {
  const { steps: _steps, className } = props
  const steps = _steps.filter(
    (s) => !Object.values(PAGE_ACTION_CONTROL).includes(s.param.type as any),
  )
  const emptySteps = [...Array(PAGE_ACTION_MAX - 2 - steps.length)]

  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((step, i) => (
        <PageActionItem
          key={step.id}
          step={step}
          className={cn(
            'relative',
            i > 0 &&
              "after:content-[''] after:absolute after:left-[-25%] after:h-[2px] after:w-[50%] after:bg-gray-600/80 after:rounded",
          )}
        />
      ))}
      {emptySteps.map((_, i) => (
        <li
          key={i}
          className={cn(
            'h-[24px] flex-1 flex items-center justify-center relative',
            (steps.length > 0 || i > 0) &&
              "after:content-[''] after:absolute after:left-[-25%] after:h-[2px] after:w-[50%] after:bg-gray-400/70 after:rounded",
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
