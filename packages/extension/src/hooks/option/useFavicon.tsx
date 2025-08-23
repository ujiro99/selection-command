import { useContext } from "react"
import { FaviconContext, FaviconEvent } from "@/context/faviconContext"
import { ParamDetail } from "@/providers/faviconContextProvider"

type Param = {
  detail: ParamDetail
}

type Listener = (event: Param) => void

export const useFavicon = () => {
  const { faviconUrl, isLoading, setIconUrlSrc } = useContext(FaviconContext)

  const subscribe = (event: FaviconEvent, func: Listener) => {
    window.addEventListener(event, func as any)
    return () => window.removeEventListener(event, func as any)
  }

  return { subscribe, faviconUrl, isLoading, setIconUrlSrc }
}
