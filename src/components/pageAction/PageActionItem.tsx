import { useEffect, useState, useRef } from 'react'
import { Trash2, Check, Pencil } from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { EditButton } from '@/components/option/EditButton'
import { Tooltip } from '@/components/Tooltip'
import { TypeIcon } from '@/components/pageAction/TypeIcon'
import { HoverArea } from '@/components/menu/HoverArea'

import { cn, capitalize, onHover, isEmpty } from '@/lib/utils'
import { t } from '@/services/i18n'
import type { PageActionStep } from '@/types'
import type { PageAction } from '@/services/pageAction'
import { Storage } from '@/services/storage'

const isInputParam = (
  param: PageAction.Parameter,
): param is PageAction.Input => {
  return (param as PageAction.Input).value != null
}

type Props = {
  step: PageActionStep
  className?: string
  currentId: string | undefined
  failedId: string | undefined
  failedMessage: string | undefined
  onClickRemove: (id: string) => void
  onClickEdit: (id: string) => void
  onChangeLabel: (id: string, label: string) => void
}

export function PageActionItem(props: Props): JSX.Element {
  const { step, currentId, failedId, failedMessage } = props
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [capture, setCapture] = useState<string>()
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const anchorRef = useRef<HTMLLIElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const isFailed = failedId === step.id
  const hasLabel = !isEmpty(step.param.label)
  const capturedId = step.captureId

  // For Input step
  const param = step.param
  const isInput = isInputParam(param)

  // For HoverArea
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [contentRect, setContentRect] = useState<DOMRect | null>(null)

  const onHoverTrigger = (hover: boolean) => {
    setIsOpen(hover)
    // Delay to wait finishing animation.
    setTimeout(() => {
      if (anchorRef.current && contentRef.current) {
        setAnchorRect(anchorRef.current.getBoundingClientRect())
        setContentRect(contentRef.current.getBoundingClientRect())
      }
    }, 250)
  }

  const handleClickEditLabel = () => {
    setIsEditingLabel(true)
  }

  const handleClickEditLabelFinish = () => {
    setIsEditingLabel(false)
    if (labelInputRef.current) {
      props.onChangeLabel(step.id, labelInputRef.current.value)
    }
  }

  const handleClickEdit = () => {
    setIsOpen(false)
    props.onClickEdit(step.id)
  }

  const handleClickRemove = () => {
    setIsOpen(false)
    props.onClickRemove(step.id)
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

  useEffect(() => {
    if (capturedId == null) return
    Storage.getCapture(capturedId).then((data) => {
      // console.log('getCapture', capturedId, data)
      if (data == null) return
      setCapture(data)
    })
  }, [capturedId])

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
          currentId === step.id ? 'bg-sky-200' : '',
          isFailed ? 'bg-red-200' : '',
        )}
      >
        <TypeIcon
          type={step.param.type}
          className="stroke-gray-700"
          size={14}
        />
      </div>

      {/* Detail Popover */}
      <Popover open={isOpen}>
        <PopoverAnchor virtualRef={anchorRef} />
        {shouldRender && (
          <PopoverContent
            className={
              'bg-white px-3 py-2 min-w-32 max-w-80 text-xs text-gray-600'
            }
            side={'top'}
            arrowPadding={-5}
            ref={contentRef}
          >
            <p className="text-sm font-semibold font-mono flex items-center gap-1.5">
              <TypeIcon
                type={step.param.type}
                className="stroke-gray-700"
                size={14}
              />
              {capitalize(step.param.type)}
            </p>
            {isFailed && (
              <p className="text-sm text-red-600">{failedMessage}</p>
            )}
            <div className="my-1 flex items-center gap-1">
              {capture && (
                <img
                  src={capture}
                  alt="capture of target element."
                  className="rounded-md w-12 h-12 object-scale-down"
                />
              )}
              {hasLabel && isEditingLabel ? (
                <>
                  <p className="flex-1">
                    <Input
                      ref={labelInputRef}
                      defaultValue={step.param.label}
                      className="h-auto px-1 text-sm"
                    />
                  </p>
                  <button
                    type="button"
                    className="outline-gray-200 p-1 ml-0.5 rounded-md transition hover:bg-gray-100 hover:scale-125"
                    onClick={handleClickEditLabelFinish}
                  >
                    <Check className="stroke-gray-500" size={14} />
                  </button>
                </>
              ) : (
                <>
                  <p className="truncate text-sm px-1 py-1.5 flex-1 min-w-40">
                    <span>{step.param.label}</span>
                  </p>
                  <button
                    type="button"
                    className="outline-gray-200 p-1 rounded-md transition hover:bg-gray-100 hover:scale-125"
                    onClick={handleClickEditLabel}
                  >
                    <Pencil className="stroke-gray-500" size={14} />
                  </button>
                </>
              )}
            </div>
            {isInput && (
              <pre className="text-xs mt-0.5 p-2 bg-gray-100 font-mono rounded whitespace-pre-line">
                {param.value}
              </pre>
            )}
            <div className="flex justify-end gap-0.5 mt-1.5">
              {isInput && <EditButton onClick={handleClickEdit} size={14} />}
              <RemoveButton onClick={handleClickRemove} size={14} />
            </div>
            <PopoverArrow className="fill-white" height={6} />
            <HoverArea
              anchor={anchorRect}
              content={contentRect}
              isHorizontal={true}
            />
          </PopoverContent>
        )}
      </Popover>
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
          'outline-gray-200 p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group/remove-button'
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
