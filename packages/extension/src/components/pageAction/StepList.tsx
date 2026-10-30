import { cn, onHover } from "@/lib/utils"
import { useZoomCompensation } from "@/hooks/usePageZoom"
import { PageActionItem } from "@/components/pageAction/PageActionItem"
import { CircleDashed } from "lucide-react"
import type { PageActionStep, DeepPartial } from "@/types"

import { PAGE_ACTION_MAX, PAGE_ACTION_CONTROL } from "@/const"
import { e2a } from "@/lib/utils"
import { TEST_IDS } from "@/testIds"

const noop = () => {}

type Props = {
  steps: PageActionStep[]
  currentId?: string
  failedId?: string
  failedMessage?: string
  onClickRemove?: (id: string) => void
  onClickEdit?: (id: string) => void
  onChange?: (id: string, partial: DeepPartial<PageActionStep>) => void
  onChangeHover?: (hover: boolean) => void
}

export function StepList(props: Props): JSX.Element {
  const { steps: _steps, currentId, failedId, failedMessage } = props
  const steps = _steps.filter(
    (f) => !e2a(PAGE_ACTION_CONTROL).includes(f.param.type),
  )
  const emptySteps = [...Array(PAGE_ACTION_MAX - 2 - steps.length)]

  const zoomCompensation = useZoomCompensation()
  const onChangeHover = props.onChangeHover ?? noop
  const onClickRemove = props.onClickRemove ?? noop
  const onClickEdit = props.onClickEdit ?? noop
  const onChange = props.onChange ?? noop

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
          onChange={onChange}
          testId={TEST_IDS.pageActionStep(step.param.type)}
          className={cn(
            "relative",
            i > 0 &&
              "after:content-[''] after:z-[-1] after:absolute after:left-[-25%] after:h-0.5 after:w-[50%] after:bg-gray-500/80 dark:after:bg-gray-400/80 after:rounded-sm",
          )}
        />
      ))}
      {emptySteps.map((_, i) => (
        <li
          key={i}
          className={cn(
            "h-6 flex-1 flex items-center justify-center relative",
            (steps.length > 0 || i > 0) &&
              "after:content-[''] after:z-[-1] after:absolute after:left-[-25%] after:h-0.5 after:w-[50%] after:bg-gray-400/70 dark:after:bg-gray-600/70 after:rounded-sm",
          )}
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-full h-fit w-fit">
            <CircleDashed
              size={12 * zoomCompensation}
              strokeWidth={3}
              className="stroke-gray-400 dark:stroke-gray-500"
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
