import React from "react"
import ReactDOM from "react-dom/client"
import { Option } from "@/components/option/Option"
import icons from "./icons.svg?raw"
import { getCurrentLocale } from "@/services/i18n"
import { initSentry, Sentry } from "@/lib/sentry"

import "@/components/global.css"
import "@/components/Animation.css"

// Initialize Sentry for options page
initSentry().catch((error) => {
  console.error("Failed to initialize Sentry in options page:", error)
})

// Set the document language to the current locale
document.documentElement.lang = getCurrentLocale()

const root = document.getElementById("root")
if (root) {
  try {
    root.insertAdjacentHTML("afterend", icons)
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Option />
      </React.StrictMode>,
    )
  } catch (error) {
    console.error("Failed to render options page:", error)
    Sentry.captureException(error as Error)
  }
}
