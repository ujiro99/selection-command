import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SelectOptionType = {
  name: string
  value: string
  iconUrl?: string
}

type SelectFieldType = {
  control: any
  name: string
  formLabel: string
  options: SelectOptionType[]
  placeholder?: string
}

export const SelectField = ({
  control,
  name,
  formLabel,
  options,
  placeholder,
}: SelectFieldType) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
          </div>
          <div className="w-4/6">
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem
                    value={opt.value}
                    key={opt.value}
                    className="hover:bg-gray-100"
                  >
                    {opt.iconUrl != null ? (
                      <span className=" flex items-center gap-1">
                        <img
                          src={opt.iconUrl}
                          alt={opt.name}
                          className="w-4 h-4 mr-2"
                        />
                        {opt.name}
                      </span>
                    ) : (
                      opt.name
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
