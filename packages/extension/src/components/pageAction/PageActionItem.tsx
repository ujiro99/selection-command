import { useEffect, useState, useRef } from "react"
import { Trash2, Check } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from "@/components/ui/popover"
import { EditButton } from "@/components/option/EditButton"
import { Tooltip } from "@/components/Tooltip"
import { TypeIcon } from "@/components/pageAction/TypeIcon"
import { InputField } from "@/components/pageAction/InputField"
import { HoverArea } from "@/components/menu/HoverArea"

import { cn, capitalize, onHover } from "@/lib/utils"
import { t } from "@/services/i18n"
import { paramToStr } from "@/services/pageAction"
import type { PageActionStep, DeepPartial } from "@/types"
import type { PageAction } from "@/services/pageAction"
import { PAGE_ACTION_EVENT } from "@/const"

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
  onChange: (id: string, partial: DeepPartial<PageActionStep>) => void
}

export function PageActionItem(props: Props): JSX.Element {
  const { step, currentId, failedId, failedMessage } = props
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const anchorRef = useRef<HTMLLIElement>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const delayInputRef = useRef<HTMLInputElement>(null)
  const isFailed = failedId === step.id

  const param = step.param
  const isInput = isInputParam(param)
  const isKey = isKeyboardParam(param)
  const isScroll = isScrollParam(param)

  // For HoverArea
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [contentRect, setContentRect] = useState<DOMRect | null>(null)

  const onHoverTrigger = (hover: boolean) => {
    if (isEditing && !hover) return
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
    handleClickEditFinish()
    setIsOpen(false)
    setTimeout(() => {
      if (anchorRef.current && contentRef.current) {
        setAnchorRect(anchorRef.current.getBoundingClientRect())
        setContentRect(contentRef.current.getBoundingClientRect())
      }
    }, 250)
  }

  const handleClickEdit = () => {
    setIsEditing(true)
  }

  const handleClickEditFinish = () => {
    let delayMs = parseInt(delayInputRef.current?.value ?? "0", 10)
    isNaN(delayMs) && (delayMs = 0)
    const label = labelInputRef.current?.value ?? ""
    props.onChange(step.id, { delayMs, param: { label } })
    setIsEditing(false)
  }

  const handleEditInputValue = () => {
    if (!isEditing || !isInput) return
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

  return (
    <li
      className={cn(
        "h-[24px] flex-1 flex items-center justify-center pointer-events-auto group relative",
        props.className,
      )}
      ref={anchorRef}
      {...onHover(onHoverTrigger, true)}
    >
      {/* List icon */}
      <div
        className={cn(
          "transition relative group-hover:scale-150 p-1 rounded-full",
          currentId === step.id ? "bg-sky-200" : "",
          isFailed ? "bg-red-200" : "",
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
              "border bg-white px-3 pt-4 pb-2 min-w-56 max-w-80 text-gray-600"
            }
            side={"top"}
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

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-1">
                <InputField
                  label={t("Option_pageAction_label")}
                  type="text"
                  defaultValue={step.param.label}
                  ref={labelInputRef}
                  className="flex-1"
                  isEditing={isEditing}
                  inputProps={{
                    placeholder: "e.g. Submit",
                  }}
                />
              </div>

              {(isInput || isScroll || isKey) && (
                <div className="flex items-center gap-1">
                  <label className="w-1/3 text-xs">
                    {t("Option_pageAction_value")}
                  </label>
                  <pre
                    className={cn(
                      "w-2/3 max-h-32 truncate text-xs p-2 bg-gray-100 font-mono rounded whitespace-pre-line",
                      isInput &&
                        isEditing &&
                        "border border-gray-300 shadow cursor-pointer",
                    )}
                    onClick={handleEditInputValue}
                  >
                    {paramToStr(param)}
                  </pre>
                </div>
              )}

              <div>
                <InputField
                  label={t("Option_pageAction_delay")}
                  unit={"ms"}
                  type="number"
                  defaultValue={step.delayMs}
                  ref={delayInputRef}
                  isEditing={isEditing}
                  inputProps={{
                    min: 0,
                    max: 10000,
                    step: 10,
                    placeholder: "e.g. 100",
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-0.5 mt-2">
              {!isEditing ? (
                <EditButton onClick={handleClickEdit} size={16} />
              ) : (
                <button
                  className={cn(
                    "outline-gray-200 p-2 rounded-md transition hover:bg-gray-200 hover:scale-125 group/edit-button",
                  )}
                  onClick={handleClickEditFinish}
                >
                  <Check className={cn("stroke-gray-500")} size={16} />
                </button>
              )}

              <RemoveButton onClick={handleClickRemove} size={16} />
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
          "outline-gray-200 p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group/remove-button"
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
        text={t("Option_remove_tooltip")}
      />
    </>
  )
}
