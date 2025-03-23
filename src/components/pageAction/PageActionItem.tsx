import { useEffect, useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from '@/components/ui/popover'
import { EditButton } from '@/components/option/EditButton'
import { Tooltip } from '@/components/Tooltip'
import { TypeIcon } from '@/components/pageAction/TypeIcon'

import { cn, capitalize, onHover } from '@/lib/utils'
import { t } from '@/services/i18n'
import type { PageActionStep } from '@/types'

type Props = {
  step: PageActionStep
  className?: string
  currentId: string | undefined
  failedId: string | undefined
  failedMessage: string | undefined
  onClickRemove: (id: string) => void
  onClickEdit: (id: string) => void
}

export function PageActionItem(props: Props): JSX.Element {
  const { step, currentId, failedId, failedMessage } = props
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const anchorRef = useRef<HTMLLIElement>(null)
  const isInput = step.type === 'input'
  const isFailed = failedId === step.id

  // For HoverArea
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [hoverAreaStyle, setHoverAreaStyle] = useState<React.CSSProperties>()

  const onHoverTrigger = (hover: boolean) => {
    setIsOpen(hover)
    // Delay to wait finishing animation.
    setTimeout(() => {
      if (anchorRef.current && contentRef.current) {
        const anchorRect = anchorRef.current.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()
        setHoverAreaStyle({
          top: Math.ceil(anchorRect.height) - 5,
          left: Math.ceil(contentRect.left - anchorRect.left),
          width: Math.ceil(contentRect.width),
          height: Math.ceil(contentRect.top - anchorRect.bottom) + 10,
        })
      }
    }, 200)
  }

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
        props.className,
      )}
      ref={anchorRef}
      {...onHover(onHoverTrigger, true)}
    >
      {/* List icon */}
      <div
        className={cn(
          'transition relative group-hover:scale-150 p-1 rounded-full',
          currentId === step.id ? 'bg-sky-400/50' : '',
          isFailed ? 'bg-red-400/50' : '',
        )}
      >
        <TypeIcon type={step.type} className="stroke-gray-700" size={14} />
      </div>

      {/* Detail Popover */}
      <Popover open={isOpen}>
        <PopoverAnchor virtualRef={anchorRef} />
        {shouldRender && (
          <PopoverContent
            className={'bg-white px-3 py-2 text-xs text-gray-600 shadow-md'}
            side={'bottom'}
            arrowPadding={-5}
            ref={contentRef}
          >
            <p className="text-sm font-medium font-mono flex items-center gap-1.5">
              <TypeIcon
                type={step.type}
                className="stroke-gray-700"
                size={14}
              />
              {capitalize(step.type)}
            </p>
            <p className="truncate w-32 text-xs mt-2">{`${step.param.label}`}</p>
            {isFailed && (
              <p className="absolute bottom-[-40px] text-xs leading-3 text-red-600">
                {failedMessage}
              </p>
            )}
            <div className="flex justify-end gap-0.5 mt-0.5">
              {isInput && (
                <EditButton
                  onClick={() => props.onClickEdit(step.id)}
                  size={14}
                />
              )}
              <RemoveButton
                onClick={() => props.onClickRemove(step.id)}
                size={14}
              />
            </div>
            <PopoverArrow className="fill-white" height={6} />
          </PopoverContent>
        )}
      </Popover>
      {shouldRender && (
        <div className="hoverArea absolute" style={hoverAreaStyle} />
      )}
    </li>
  )
}

type RemoveButtonProps = {
  onClick: () => void
  size: number
}

const RemoveButton = ({ onClick, size }: RemoveButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        type="button"
        className={
          'p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group/remove-button'
        }
        onClick={onClick}
        ref={buttonRef}
      >
        <Trash2
          className="stroke-gray-500 group-hover/remove-button:stroke-red-500"
          size={size}
        />
      </button>
      <Tooltip
        positionElm={buttonRef.current}
        text={t('Option_remove_tooltip')}
      />
    </>
  )
}
