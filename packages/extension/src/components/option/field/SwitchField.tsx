import { useRef } from "react"
import { Switch } from "@/components/ui/switch"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Info } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { cn } from "@/lib/utils"

type SwitchFieldType = {
  control: any
  name: string
  formLabel: string
  description?: string
  tooltip?: string
}

export const SwitchField = ({
  control,
  name,
  formLabel,
  description,
  tooltip,
}: SwitchFieldType) => {
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
          <div className="w-4/6 px-1">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}
