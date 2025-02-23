import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type TextareaFieldType = {
  control: any
  name: string
  formLabel: string
  placeholder?: string
}

export const TextareaField = ({
  control,
  name,
  formLabel,
  placeholder,
}: TextareaFieldType) => {
  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const elm = e.target as HTMLTextAreaElement
    elm.style.height = '5px'
    elm.style.height = elm.scrollHeight + 'px'
  }

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
            <FormControl>
              <Textarea
                {...field}
                placeholder={placeholder}
                className="resize-none overflow-hidden max-h-80"
                onInput={handleInput}
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
