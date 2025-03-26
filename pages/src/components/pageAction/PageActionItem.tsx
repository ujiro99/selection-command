import { useEffect, useState, useRef } from 'react'

import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from '@/components/ui/popover'
import { TypeIcon } from '@/components/pageAction/TypeIcon'

import { cn, capitalize, onHover, isEmpty } from '@/lib/utils'
import type { PageActionStep, PageAction } from '@/types'

type Props = {
  step: PageActionStep
  className?: string
}

const isInputParam = (
  param: PageAction.Parameter,
): param is PageAction.Input => {
  return (param as PageAction.Input).value != null
}

export function PageActionItem(props: Props): JSX.Element {
  const { step, className } = props
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const anchorRef = useRef<HTMLLIElement>(null)
  const hasLabel = !isEmpty(step.param.label)

  // For Input step
  const isInput = isInputParam(step.param)
  const inputParam = step.param as PageAction.Input

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen) {
      timer = setTimeout(() => {
        setShouldRender(true)
      }, 100)
    } else {
      setShouldRender(false)
    }
    return () => clearTimeout(timer)
  }, [isOpen])

  return (
    <li
      className={cn(
        'h-[24px] flex-1 flex items-center justify-center pointer-events-auto group relative',
        className,
      )}
      ref={anchorRef}
      {...onHover(setIsOpen, true)}
    >
      {/* List icon */}
      <div className="transition relative group-hover:scale-150 p-1 rounded-full">
        <TypeIcon type={step.type} className="stroke-gray-700" size={16} />
      </div>

      {/* Detail Popover */}
      <Popover open={isOpen}>
        <PopoverAnchor virtualRef={anchorRef} />
        {shouldRender && (
          <PopoverContent
            className={'bg-white p-3 max-w-80 text-xs text-gray-600'}
            side={'bottom'}
            arrowPadding={-5}
          >
            <p className="text-sm font-semibold font-mono flex items-center gap-2">
              <TypeIcon
                type={step.type}
                className="stroke-gray-700"
                size={16}
              />
              {capitalize(step.type)}
            </p>
            {hasLabel && (
              <p className="truncate text-sm mt-1">{step.param.label}</p>
            )}
            {isInput && inputParam.value != inputParam.label && (
              <pre className="text-xs mt-1 p-2 bg-gray-100 font-mono rounded whitespace-pre-line">
                {inputParam.value}
              </pre>
            )}
            <PopoverArrow className="fill-white" height={6} />
          </PopoverContent>
        )}
      </Popover>
    </li>
  )
}
