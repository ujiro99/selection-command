import { Switch } from "@/components/ui/switch"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InfoTooltip } from "./InfoTooltip"
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
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <div className={cn(tooltip && "flex items-center gap-1 mr-1")}>
              <FormLabel>
                <span>{formLabel}</span>
              </FormLabel>
              {tooltip && <InfoTooltip text={tooltip} />}
            </div>
            {description && <FormDescription>{description}</FormDescription>}
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
