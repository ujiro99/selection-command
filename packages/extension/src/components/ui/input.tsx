import * as React from "react"

import { cn } from "@/lib/utils"

type Props = {
  unit?: string
  inputClassName?: string
}

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & Props
>(({ className, type, unit, inputClassName, ...props }, ref) => {
  return (
    <div className={cn("relative", className)}>
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm lg:text-base",
          inputClassName,
        )}
        ref={ref}
        {...props}
      />
      {unit && (
        <span className="absolute right-[40px] top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {unit}
        </span>
      )}
    </div>
  )
})
Input.displayName = "Input"

export { Input }
