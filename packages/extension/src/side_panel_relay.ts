import { relay } from "@/services/sidePanelRelay"

// Entry point of the side panel relay page. See services/sidePanelRelay.ts.
relay(location.search, (url) => location.replace(url)).catch((e) => {
  console.error("[sidePanelRelay] Failed:", e)
})
