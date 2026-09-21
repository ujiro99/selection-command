import * as React from "react"

import { cn } from "@/lib/utils"

type Props = {
  unit?: string
  inputClassName?: string
  showRemainingCount?: boolean
  remainingCountLabel?: string
}

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & Props
>(
  (
    {
      className,
      type,
      unit,
      inputClassName,
      showRemainingCount = false,
      remainingCountLabel,
      maxLength,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledLength, setUncontrolledLength] = React.useState(
      () => String(defaultValue ?? "").length,
    )
    const currentLength =
      value != null ? String(value).length : uncontrolledLength
    const remainingCount =
      showRemainingCount && maxLength != null
        ? Math.max(0, maxLength - currentLength)
        : null

    return (
      <div className={cn("relative", className)}>
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm lg:text-base",
            remainingCount != null && "pr-24",
            inputClassName,
          )}
          ref={ref}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={(event) => {
            if (value == null) setUncontrolledLength(event.target.value.length)
            onChange?.(event)
          }}
          {...props}
        />
        {unit && (
          <span className="absolute right-[40px] top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {unit}
          </span>
        )}
        {remainingCount != null && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {remainingCountLabel ? `${remainingCountLabel}: ` : ""}
            {remainingCount}
          </span>
        )}
      </div>
    )
  },
)
Input.displayName = "Input"

export { Input }
