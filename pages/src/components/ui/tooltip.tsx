'use client'

import * as React from 'react'
import { useState } from 'react'

import { PopoverContent } from '@/components/ui/popover'
import * as PopoverPrimitive from '@radix-ui/react-popover'
const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverArrow = PopoverPrimitive.Arrow
const PopoverPortal = PopoverPrimitive.Portal

import { cn, onHover } from '@/lib/utils'

type TooltipProps = React.ComponentPropsWithoutRef<typeof PopoverContent> & {
  render: () => React.JSX.Element
}

const Tooltip = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  TooltipProps
>(({ className, sideOffset = 4, children, render, ...props }, ref) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open}>
      <PopoverTrigger asChild {...onHover(setOpen, true, { delay: 300 })}>
        {children}
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          ref={ref}
          sideOffset={sideOffset}
          side="top"
          arrowPadding={-1}
          className={cn(
            'min-w-4 bg-stone-600 px-2 py-1.5 text-xs text-white shadow-md pointer-events-none',
            className,
          )}
          {...props}
        >
          {render()}
          <PopoverArrow className="fill-primary" />
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
})

export { Tooltip }
