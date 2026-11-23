import { createContext, useContext } from "react"
import { SIDE, ALIGN } from "@/const"

export type ContextType = {
  isPreview?: boolean
  inTransition?: boolean
  inOnboarding?: boolean
  side: SIDE
  align: ALIGN
  hasIconColor?: boolean
  /**
   * Treat the pointer as having left the popup. Call it when an element under
   * the pointer is removed (e.g. a closed hover card), since no mouseleave
   * fires then and selection detection would stay disabled.
   */
  clearHover?: () => void
}

export const popupContext = createContext<ContextType>({} as ContextType)

export const usePopupContext = () => {
  return useContext(popupContext)
}
