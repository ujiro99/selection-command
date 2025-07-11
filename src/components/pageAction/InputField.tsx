import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type Props = {
  label: string
  unit?: string
  type: string
  defaultValue: string | number
  isEditing: boolean
  className?: string
  inputProps?: React.ComponentProps<typeof Input>
}

export const InputField = forwardRef<HTMLInputElement, Props>(
  (props: Props, ref) => {
    const isEditing = props.isEditing
    return (
      <div className={cn("flex items-center gap-1", props.className)}>
        <label className="w-1/3 text-xs">{props.label}</label>
        <div className="w-2/3 flex items-center gap-1">
          <Input
            type={props.type}
            defaultValue={props.defaultValue ?? "---"}
            className="w-full"
            inputClassName={cn(
              "h-auto px-1 py-0 text-sm",
              !isEditing &&
                "border-white shadow-none truncate disabled:cursor-auto disabled:opacity-100",
              isEditing && "px-2 py-1.5 border-gray-300",
            )}
            ref={ref}
            unit={props.unit}
            disabled={!isEditing}
            {...props.inputProps}
          />
        </div>
      </div>
    )
  },
)
