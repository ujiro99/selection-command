import React from 'react'
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSetting } from '@/hooks/useSetting'

type PopupProps = {
  children: React.ReactNode
  text: string
  disabled?: boolean
}

export function Tooltip(props: PopupProps) {
  const { settings } = useSetting()
  const popupPlacement = settings.popupPlacement
  let placement = 'top' as 'top' | 'bottom'
  if (popupPlacement.startsWith('bottom')) {
    placement = 'bottom'
  }

  if (props.disabled) {
    return null
  }

  return (
    <TooltipProvider delayDuration={300}>
      <TooltipRoot>
        <TooltipTrigger asChild>{props.children}</TooltipTrigger>
        <TooltipContent side={placement}>{props.text}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}
