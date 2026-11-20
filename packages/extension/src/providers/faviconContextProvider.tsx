import { ReactNode, useState, useEffect, useRef } from "react"
import { fetchIconUrl } from "@/services/chrome"
import { isEmpty } from "@/lib/utils"
import { isUrl } from "@/lib/url"
import { FaviconContext, FaviconEvent } from "@/context/faviconContext"

export type ParamDetail = {
  faviconUrl?: string
  isLoading?: boolean
  error?: Error
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
      // A newer source may start fetching while this one is still in flight.
      // Results and cleanup of a stale fetch must not clobber the newer one.
      const isCurrent = () => srcRef.current === iconUrlSrc
      try {
        setIsLoading(true)
        const iconUrl = await fetchIconUrl(iconUrlSrc)
        if (!isCurrent()) return
        setIconUrl(iconUrl)
        dispatch(FaviconEvent.SUCCESS, { faviconUrl: iconUrl })
      } catch (e: any) {
        if (!isCurrent()) return
        dispatch(FaviconEvent.FAIL, {
          isLoading: false,
          error: e,
        })
      } finally {
        if (isCurrent()) {
          fetchIconTO.current = 0
          srcRef.current = ""
          setIsLoading(false)
        }
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
