import { useEffect } from "react"
import { useCommandHubBridge } from "@/hooks/useCommandHubBridge"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import { SCREEN } from "@/const"

/** Minimal React component that activates the hub bridge hook. */
export function NewCommandHubBridge(): JSX.Element {
  useCommandHubBridge()
  useEffect(() => {
    sendEvent(ANALYTICS_EVENTS.HUB_SCREEN_OPENED, {}, SCREEN.COMMAND_HUB)
  }, [])
  return <></>
}
