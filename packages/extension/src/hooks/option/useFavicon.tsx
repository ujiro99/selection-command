import {
  ReactNode,
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react"
import { fetchIconUrl } from "@/services/chrome"
import { isEmpty, isUrl } from "@/lib/utils"

type ContextType = {
  isLoading: boolean
  iconUrlSrc: string
  faviconUrl: string
  setIconUrlSrc: (src: string) => void
}
const FaviconContext = createContext<ContextType>({} as ContextType)

export enum FaviconEvent {
  START = "START",
  SUCCESS = "SUCCESS",
  FAIL = "FAIL",
  FINISH = "FINISH",
}

const dispatch = (eve: FaviconEvent, detail: ParamDetail) => {
  window.dispatchEvent(new CustomEvent(eve, { detail }))
}

export const FaviconContextProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [iconUrlSrc, setIconUrlSrc] = useState<string>("")
  const [iconUrl, setIconUrl] = useState<string>("")
  const [isLoading, _setIsLoading] = useState(false)
  const fetchIconTO = useRef(0)
  const srcRef = useRef("")

  const setIsLoading = (isLoading: boolean) => {
    _setIsLoading(isLoading)
    dispatch(isLoading ? FaviconEvent.START : FaviconEvent.FINISH, {
      isLoading,
      faviconUrl: isLoading ? "/loading.gif" : "",
    })
  }

  useEffect(() => {
    if (isEmpty(iconUrlSrc) || !isUrl(iconUrlSrc)) return
    srcRef.current = iconUrlSrc

    // debounce
    clearTimeout(fetchIconTO.current)
    fetchIconTO.current = window.setTimeout(async () => {
      if (isEmpty(iconUrlSrc)) return
      try {
        setIsLoading(true)
        const iconUrl = await fetchIconUrl(iconUrlSrc)
        if (srcRef.current != iconUrlSrc) throw new Error("Icon url mismatch")
        setIconUrl(iconUrl)
        dispatch(FaviconEvent.SUCCESS, { faviconUrl: iconUrl })
      } catch (e: any) {
        dispatch(FaviconEvent.FAIL, {
          isLoading: false,
          error: e,
        })
      } finally {
        fetchIconTO.current = 0
        srcRef.current = ""
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(fetchIconTO.current)
  }, [iconUrlSrc])

  return (
    <FaviconContext.Provider
      value={{ iconUrlSrc, setIconUrlSrc, faviconUrl: iconUrl, isLoading }}
    >
      {children}
    </FaviconContext.Provider>
  )
}

type ParamDetail = { faviconUrl?: string; isLoading?: boolean; error?: Error }
type Param = {
  detail: ParamDetail
}
type Listener = (event: Param) => void

export const useFavicon = () => {
  const { faviconUrl, isLoading, setIconUrlSrc } = useContext(FaviconContext)

  const subscribe = (event: FaviconEvent, func: Listener) => {
    window.addEventListener(event, func as any)
  }

  const unsubscribe = (event: FaviconEvent, func: Listener) => {
    window.removeEventListener(event, func as any)
  }

  return { subscribe, unsubscribe, faviconUrl, isLoading, setIconUrlSrc }
}
