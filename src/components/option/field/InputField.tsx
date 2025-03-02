import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

type InputFieldType = {
  control: any
  name: string
  formLabel: string
  inputProps: React.ComponentProps<typeof Input>
  description?: string
  onAutoFill?: (value: string) => void
}

export const InputField = ({
  control,
  name,
  formLabel,
  inputProps,
  description,
}: InputFieldType) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <div className="w-4/6 relative">
            <FormControl>
              <Input {...field} {...inputProps} />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
