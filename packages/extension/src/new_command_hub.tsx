import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import { useCommandHubBridge } from "@/hooks/useCommandHubBridge"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import { SCREEN } from "@/const"

/** Minimal React component that activates the hub bridge hook. */
function NewCommandHubBridge(): JSX.Element {
  useCommandHubBridge()
  useEffect(() => {
    sendEvent(ANALYTICS_EVENTS.HUB_SCREEN_OPENED, {}, SCREEN.COMMAND_HUB)
  }, [])
  return <></>
}

const rootDiv = document.createElement("div")
document.body.appendChild(rootDiv)
createRoot(rootDiv).render(<NewCommandHubBridge />)
