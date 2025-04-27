import { useEffect, useState, useRef } from 'react'
import { Trash2, Check } from 'lucide-react'

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
import { paramToStr } from '@/services/pageAction'
import type { PageActionStep } from '@/types'
import type { PageAction } from '@/services/pageAction'
import { Storage } from '@/services/storage'
import { PAGE_ACTION_EVENT } from '@/const'

const isInputParam = (
  param: PageAction.Parameter,
): param is PageAction.Input => {
  return param.type === PAGE_ACTION_EVENT.input
}

const isKeyboardParam = (
  param: PageAction.Parameter,
): param is PageAction.Keyboard => {
  return param.type === PAGE_ACTION_EVENT.keyboard
}

const isScrollParam = (
  param: PageAction.Parameter,
): param is PageAction.Scroll => {
  return param.type === PAGE_ACTION_EVENT.scroll
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

  const param = step.param
  const isInput = isInputParam(param)
  const isKey = isKeyboardParam(param)
  const isScroll = isScrollParam(param)

  // For HoverArea
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [contentRect, setContentRect] = useState<DOMRect | null>(null)

  const onHoverTrigger = (hover: boolean) => {
    if (isEditingLabel && !hover) return
    setIsOpen(hover)
    // Delay to wait finishing animation.
    setTimeout(() => {
      if (anchorRef.current && contentRef.current) {
        setAnchorRect(anchorRef.current.getBoundingClientRect())
        setContentRect(contentRef.current.getBoundingClientRect())
      }
    }, 250)
  }

  const handlePointerDownOutside = () => {
    handleClickEditLabelFinish()
    setIsOpen(false)
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
              'border bg-white px-3 py-3 min-w-48 max-w-80 text-gray-600'
            }
            side={'top'}
            arrowPadding={-1}
            ref={contentRef}
            onPointerDownOutside={handlePointerDownOutside}
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
            <div className="mt-1.5 mb-1 flex items-center gap-1">
              {capture && (
                <img
                  src={capture}
                  alt="capture of target element."
                  className="rounded-md w-12 h-12 object-scale-down"
                />
              )}
              {isEditingLabel ? (
                <div className="min-w-48 flex-1 mt-0.5">
                  <label className="text-xs ml-0.5 text-gray-500">
                    {t('Option_pageAction_label')}
                  </label>
                  <p className="flex items-center gap-1">
                    <Input
                      ref={labelInputRef}
                      defaultValue={step.param.label}
                      className="h-auto px-1 text-sm"
                    />
                    <button
                      type="button"
                      className="outline-gray-200 p-1 ml-0.5 rounded-md transition hover:bg-gray-100 hover:scale-125"
                      onClick={handleClickEditLabelFinish}
                    >
                      <Check className="stroke-gray-500" size={14} />
                    </button>
                  </p>
                </div>
              ) : (
                <div className="min-w-48 flex-1 mt-0.5">
                  <label className="text-xs ml-0.5 text-gray-500">
                    {t('Option_pageAction_label')}
                  </label>
                  <div className="px-0.5 py-1 flex items-center gap-1">
                    <span className="flex-1 truncate text-sm">
                      {hasLabel ? step.param.label : '---'}
                    </span>
                    <EditButton
                      className="p-1 mr-0.5"
                      onClick={handleClickEditLabel}
                      size={14}
                    />
                  </div>
                </div>
              )}
            </div>
            {(isInput || isScroll || isKey) && (
              <div className="relative">
                <label className="text-xs ml-0.5 text-gray-500">
                  {t('Option_pageAction_value')}
                </label>
                <pre className="text-xs mt-1 p-2 bg-gray-100 font-mono rounded whitespace-pre-line">
                  {paramToStr(param)}
                </pre>
                {isInput && (
                  <EditButton
                    className="p-1 absolute right-1 bottom-1"
                    onClick={handleClickEdit}
                    size={14}
                  />
                )}
              </div>
            )}
            <div className="flex justify-end gap-0.5 mt-1">
              <RemoveButton onClick={handleClickRemove} size={14} />
            </div>
            <PopoverArrow className="fill-white mt-[-1px]" height={6} />
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
