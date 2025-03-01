import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

import { fetchIconUrl } from '@/services/chrome'
import { isEmpty, isUrl } from '@/lib/utils'

type InputFieldType = {
  control: any
  name: string
  formLabel: string
  inputProps: React.ComponentProps<typeof Input>
  description?: string
  iconUrlSrc?: string
  onAutoFill?: (value: string) => void
}

export const InputField = ({
  control,
  name,
  formLabel,
  inputProps,
  description,
  iconUrlSrc,
  onAutoFill,
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
            {description && <FormDescription>{description}</FormDescription>}
          </div>

          <div className="w-4/6 relative">
            <FormControl>
              {type === 'iconUrl' ? (
                <IconUrlInput
                  field={field}
                  inputProps={inputProps}
                  iconUrlSrc={iconUrlSrc}
                  onAutoFill={onAutoFill}
                />
              ) : (
                <Input {...field} {...inputProps} />
              )}
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

type IconUrlInputType = {
  field: any
  inputProps: React.ComponentProps<typeof Input>
  iconUrlSrc?: string
  onAutoFill?: (value: string) => void
}

const IconUrlInput = ({
  field,
  inputProps,
  iconUrlSrc,
  onAutoFill,
}: IconUrlInputType) => {
  const fetchIconTO = useRef(0)
  const srcRef = useRef('')
  const [initialized, setInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const hasIcon = !isEmpty(field.value)

  useEffect(() => {
    setTimeout(() => setInitialized(true), 100)
  }, [])

  useEffect(() => {
    if (!initialized) return
    if (isEmpty(iconUrlSrc) || !isUrl(iconUrlSrc)) return
    srcRef.current = iconUrlSrc!

    // debounce
    clearTimeout(fetchIconTO.current)
    fetchIconTO.current = window.setTimeout(async () => {
      if (isEmpty(iconUrlSrc)) return
      try {
        setIsLoading(true)
        const iconUrl = await fetchIconUrl(iconUrlSrc!)
        if (srcRef.current != iconUrlSrc) return
        if (onAutoFill) onAutoFill(iconUrl)
      } finally {
        fetchIconTO.current = 0
        srcRef.current = ''
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(fetchIconTO.current)
  }, [iconUrlSrc])

  return isLoading ? (
    <Loading />
  ) : (
    <>
      <Input {...field} {...inputProps} className="pl-10" />
      {hasIcon && (
        <img
          className="absolute top-[0.7em] left-[0.9em] w-6 h-6 rounded"
          src={field.value}
          alt={`favicon of ${iconUrlSrc}`}
        />
      )}
    </>
  )
}

const Loading = () => (
  <div className="cursor-wait w-full h-10 border border-input shadow-sm bg-gray-100 animate-pulse rounded-md" />
)
