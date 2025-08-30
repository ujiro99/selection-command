import { useState } from "react"
import { Check } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { Tooltip } from "@/components/Tooltip"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE } from "@/const"
import { cn } from "@/lib/utils"
import { t as _t } from "@/services/i18n"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

// Icon mapping
const getIconForMode = (mode: string) => {
  if (mode === OPEN_MODE.POPUP || mode === PAGE_ACTION_OPEN_MODE.POPUP) {
    return "/setting/open_mode/popup.png"
  }
  if (mode === OPEN_MODE.TAB || mode === PAGE_ACTION_OPEN_MODE.TAB) {
    return "/setting/open_mode/tab.png"
  }
  if (
    mode === OPEN_MODE.BACKGROUND_TAB ||
    mode === PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB
  ) {
    return "/setting/open_mode/background_tab.png"
  }
  if (mode === OPEN_MODE.WINDOW || mode === PAGE_ACTION_OPEN_MODE.WINDOW) {
    return "/setting/open_mode/window.png"
  }
  return "/setting/open_mode/popup.png"
}

// Order of options
const SEARCH_MODES = [
  OPEN_MODE.POPUP,
  OPEN_MODE.WINDOW,
  OPEN_MODE.TAB,
  OPEN_MODE.BACKGROUND_TAB,
] as const

const PAGE_ACTION_MODES = [
  PAGE_ACTION_OPEN_MODE.POPUP,
  PAGE_ACTION_OPEN_MODE.WINDOW,
  PAGE_ACTION_OPEN_MODE.TAB,
  PAGE_ACTION_OPEN_MODE.BACKGROUND_TAB,
] as const

type OpenModeToggleFieldProps = {
  control: any
  name: string
  formLabel: string
  description?: string
  type: "search" | "pageAction"
}

export const OpenModeToggleField = ({
  control,
  name,
  formLabel,
  description,
  type,
}: OpenModeToggleFieldProps) => {
  const modes = type === "search" ? SEARCH_MODES : PAGE_ACTION_MODES

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-start gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div className="w-4/6">
            <FormControl>
              <ToggleGroup
                type="single"
                variant="outline"
                value={field.value}
                onValueChange={(val) => {
                  if (val) field.onChange(val)
                }}
                className="grid grid-cols-4 gap-2 py-1"
              >
                {modes.map((mode) => {
                  const iconSrc = getIconForMode(mode)
                  const checked = mode === field.value
                  return (
                    <OpenModeItem
                      key={mode}
                      mode={mode}
                      iconSrc={iconSrc}
                      checked={checked}
                    />
                  )
                })}
              </ToggleGroup>
            </FormControl>
          </div>
        </FormItem>
      )}
    />
  )
}

const OpenModeItem = ({
  mode,
  iconSrc,
  checked,
}: {
  mode: string
  iconSrc: string
  checked: boolean
}) => {
  const [tooltipRef, setTooltipRef] = useState<HTMLElement | null>(null)

  return (
    <FormItem className="h-full">
      <FormControl>
        <>
          <ToggleGroupItem
            ref={setTooltipRef}
            value={mode}
            aria-label={t(`openMode_${mode}`)}
            className={cn(
              "relative flex-col gap-0.5 h-full w-full py-1.5 shadow-sm text-xs font-medium text-gray-600 hover:text-gray-700",
              "border transition-all duration-200",
              checked && "bg-gray-50",
            )}
          >
            {checked && (
              <Check
                size={18}
                className="absolute top-2 left-2 text-gray-700"
              />
            )}
            <img
              src={iconSrc}
              alt={mode}
              className={cn("h-8 w-8 object-contain")}
            />
            <span
              className={cn("text-xs font-normal leading-tight text-gray-600")}
            >
              {t(`openMode_${mode}`)}
            </span>
          </ToggleGroupItem>
          <Tooltip
            text={t(`openMode_${mode}_desc`).replace("<wbr>", "\n")}
            className="whitespace-pre-wrap text-center"
            positionElm={tooltipRef}
          />
        </>
      </FormControl>
    </FormItem>
  )
}
