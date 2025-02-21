import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { isEmpty } from '@/lib/utils'

type InputFieldType = {
  control: any
  name: string
  formLabel: string
  inputProps: React.ComponentProps<typeof Input>
}

export const InputField = ({
  control,
  name,
  formLabel,
  inputProps,
}: InputFieldType) => {
  const type = inputProps.type
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
          </div>
          <div className="w-4/6 relative">
            {type === 'iconUrl' && !isEmpty(field.value) && (
              <img
                className="absolute top-[0.6em] left-[-3em] w-7 h-7 rounded"
                src={field.value}
                alt="folder icon"
              />
            )}
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
