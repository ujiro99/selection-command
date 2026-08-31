import { createContext, useContext } from "react"
import { SIDE, ALIGN } from "@/const"

export type ContextType = {
  isPreview?: boolean
  inTransition?: boolean
  inOnboarding?: boolean
  side: SIDE
  align: ALIGN
}

export const popupContext = createContext<ContextType>({} as ContextType)

export const usePopupContext = () => {
  return useContext(popupContext)
}
