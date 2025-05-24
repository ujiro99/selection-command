import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { MenuImage } from '@/components/menu/MenuImage'

export type SelectOptionType = {
  name: string
  value: string
  nameRender?: (name: string) => React.ReactNode
  iconUrl?: string
  iconSvg?: string
}

export type SelectGroupType = {
  label: string
  options: SelectOptionType[]
  iconUrl?: string
  iconSvg?: string
}

export type SelectFieldType = {
  control: any
  name: string
  formLabel: string
  options: (SelectOptionType | SelectGroupType)[]
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

const renderOption = (opt: SelectOptionType) => (
  <SelectItem value={opt.value} key={opt.value} className="hover:bg-gray-100">
    {renderOptionContent(opt)}
  </SelectItem>
)

const renderGroupLabel = (group: SelectGroupType) => (
  <SelectLabel className="flex items-center gap-1">
    {(group.iconUrl != null || group.iconSvg != null) && (
      <MenuImage
        src={group.iconUrl}
        svg={group.iconSvg}
        alt={group.label}
        className="w-5 h-5 mr-1.5"
      />
    )}
    {group.label}
  </SelectLabel>
)

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
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="relative">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((item, index) => {
                  if ('options' in item) {
                    // Grouped options
                    return (
                      <SelectGroup key={index}>
                        {item.label && renderGroupLabel(item)}
                        {item.options.map((opt) => (
                          <div key={opt.value} className="pl-4">
                            {renderOption(opt)}
                          </div>
                        ))}
                      </SelectGroup>
                    )
                  } else {
                    // Regular options
                    return renderOption(item)
                  }
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
