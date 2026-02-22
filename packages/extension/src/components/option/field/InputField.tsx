import { useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { MenuImage } from "@/components/menu/MenuImage"
import { Info } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"

type InputFieldType = {
  control: any
  name: string
  formLabel: string
  inputProps: React.ComponentProps<typeof Input>
  unit?: string
  description?: string
  tooltip?: string
  previewUrl?: string
}

import { isEmpty, cn } from "@/lib/utils"

export const InputField = ({
  control,
  name,
  formLabel,
  inputProps,
  unit,
  description,
  tooltip,
  previewUrl,
}: InputFieldType) => {
  const hasPreview = !isEmpty(previewUrl)
  const span = useRef<HTMLSpanElement>(null)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel
              className={cn(tooltip && "flex items-center gap-1 mr-1")}
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
                className={cn(hasPreview && "pl-10")}
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
