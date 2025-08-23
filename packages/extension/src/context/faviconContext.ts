import { createContext } from "react"

type ContextType = {
  isLoading: boolean
  iconUrlSrc: string
  faviconUrl: string
  setIconUrlSrc: (src: string) => void
}

export const FaviconContext = createContext<ContextType>({} as ContextType)

export enum FaviconEvent {
  START = "START",
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
  FINISH = "FINISH",
}
