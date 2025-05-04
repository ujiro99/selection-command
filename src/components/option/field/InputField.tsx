import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { MenuImage } from '@/components/menu/MenuImage'

type InputFieldType = {
  control: any
  name: string
  formLabel: string
  inputProps: React.ComponentProps<typeof Input>
  unit?: string
  description?: string
  previewUrl?: string
}

import { isEmpty, cn } from '@/lib/utils'

export const InputField = ({
  control,
  name,
  formLabel,
  inputProps,
  unit,
  description,
  previewUrl,
}: InputFieldType) => {
  const hasPreview = !isEmpty(previewUrl)
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
            {hasPreview && (
              <MenuImage
                className="absolute top-[0.7em] left-[0.8em] w-6 h-6 rounded"
                src={previewUrl}
                alt="Preview of image"
              />
            )}
            <FormControl>
              <Input
                className={cn(hasPreview && 'pl-10')}
                unit={unit}
                {...field}
                {...inputProps}
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
