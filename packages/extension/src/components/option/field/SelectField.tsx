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

export type SelectOptionType = {
  name: string
  value: string
  nameRender?: (name: string) => React.ReactNode
  iconUrl?: string
  iconSvg?: string
  level?: number
  isGroup?: boolean
}

export type SelectFieldType = {
  control: any
  name: string
  formLabel: string
  options: SelectOptionType[]
  placeholder?: string
  description?: string
  labelClass?: string
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
}: SelectFieldType) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel className={labelClass}>{formLabel}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div className="w-4/6">
            <Select onValueChange={field.onChange} value={field.value ?? ""}>
              <FormControl>
                <SelectTrigger className="relative">
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
