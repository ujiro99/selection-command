import { useRef } from "react"
import { cn } from "@/lib/utils"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MenuImage } from "@/components/menu/MenuImage"
import { TEST_IDS } from "@/testIds"
import { Info } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"

export type SelectOptionType = {
  name: string
  value: string
  nameRender?: (name: string) => React.ReactNode
  iconUrl?: string
  iconSvg?: string
  level?: number
  isGroup?: boolean
  tooltip?: string
}

export type SelectFieldType = {
  control: any
  name: string
  formLabel: string
  options: SelectOptionType[]
  placeholder?: string
  description?: string
  labelClass?: string
  tooltip?: string
  fallbackValue?: string
}

const renderOptionContent = (opt: SelectOptionType) => {
  const textContent = opt.nameRender ? opt.nameRender(opt.name) : opt.name

  if (opt.iconUrl == null && opt.iconSvg == null) {
    return textContent
  }

  return (
    <span className="flex items-center gap-1 truncate max-w-[400px]">
      <MenuImage
        src={opt.iconUrl}
        svg={opt.iconSvg}
        alt={opt.name}
        className="w-5 h-5 mr-1.5"
      />
      {textContent}
    </span>
  )
}

const renderOption = (opt: SelectOptionType) => {
  const level = opt.level ?? 0
  const paddingLeft = level * 16 + 32 // 32 is the width of pl-8
  return (
    <SelectItem
      value={opt.value}
      key={opt.value}
      className={`${opt.isGroup ? "pointer-events-none" : "hover:bg-gray-100"}`}
      style={{ paddingLeft }}
      data-testid={TEST_IDS.selectItem(opt.value)}
    >
      {renderOptionContent(opt)}
    </SelectItem>
  )
}

export const SelectField = ({
  control,
  name,
  formLabel,
  options,
  placeholder,
  description,
  labelClass,
  tooltip,
  fallbackValue,
}: SelectFieldType) => {
  const span = useRef<HTMLSpanElement>(null)
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel
              className={cn(
                tooltip && "flex items-center gap-1 mr-1",
                labelClass,
              )}
            >
              <span>{formLabel}</span>
              {tooltip && (
                <span
                  ref={span}
                  className="cursor-pointer p-1 rounded hover:bg-gray-100 transition-background"
                >
                  <Info className="size-4 text-foreground/60" />
                </span>
              )}
            </FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
            {tooltip && (
              <Tooltip
                positionElm={span.current}
                text={tooltip}
                className="max-w-64 whitespace-pre-wrap"
                delay={200}
              />
            )}
          </div>
          <div className="w-4/6">
            <Select
              onValueChange={field.onChange}
              value={field.value ?? fallbackValue ?? ""}
            >
              <FormControl>
                <SelectTrigger
                  className="relative"
                  data-testid={TEST_IDS.selectTrigger(name)}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((o) => renderOption(o))}
              </SelectContent>
            </Select>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
