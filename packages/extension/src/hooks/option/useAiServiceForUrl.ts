import { useEffect, useState } from "react"
import { findAiServiceByUrl } from "@/services/aiPrompt"
import type { AiService } from "@/types"

/**
 * Resolves the AI service the given URL belongs to, or null when it is not an
 * AI service. Lookups are debounced because the URL changes on every keystroke.
 */
export function useAiServiceForUrl(url: string | undefined): AiService | null {
  const [service, setService] = useState<AiService | null>(null)

  useEffect(() => {
    if (!url) {
      setService(null)
      return
    }
    let active = true
    const timer = setTimeout(async () => {
      const found = await findAiServiceByUrl(url)
      if (active) setService(found ?? null)
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [url])

  return service
}
