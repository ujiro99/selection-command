import { createRoot } from "react-dom/client"
import { NewCommandHubBridge } from "@/components/NewCommandHubBridge"

const rootDiv = document.createElement("div")
document.body.appendChild(rootDiv)
createRoot(rootDiv).render(<NewCommandHubBridge />)
