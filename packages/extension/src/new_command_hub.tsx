import { createRoot } from "react-dom/client"
import { useCommandHubBridge } from "@/hooks/useCommandHubBridge"

/** Minimal React component that activates the hub bridge hook. */
function NewCommandHubBridge(): JSX.Element {
  useCommandHubBridge()
  return <></>
}

const rootDiv = document.createElement("div")
document.body.appendChild(rootDiv)
createRoot(rootDiv).render(<NewCommandHubBridge />)
