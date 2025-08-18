import React, { useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

type TextareaFieldType = {
  control: any
  name: string
  formLabel: string
  placeholder?: string
  className?: string
}

export const TextareaField = ({
  control,
  name,
  formLabel,
  placeholder,
  className,
}: TextareaFieldType) => {
  const updateHeight = (elm: HTMLTextAreaElement) => {
    elm.style.height = "5px"
    elm.style.height = elm.scrollHeight + "px"
  }

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    updateHeight(e.target as HTMLTextAreaElement)
  }

  useEffect(() => {
    const textarea = document.getElementById(`textarea-${name}`)
    if (textarea != null) {
      updateHeight(textarea as HTMLTextAreaElement)
    }
  }, [])

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
                id={`textarea-${name}`}
                {...field}
                placeholder={placeholder}
                className={cn("resize-none max-h-80", className)}
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
