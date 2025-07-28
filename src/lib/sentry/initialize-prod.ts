import { initSentry } from "@/lib/sentry"

// Initialize Sentry for background script
initSentry().catch((error) => {
  console.error("Failed to initialize Sentry in background script:", error)
})

console.log("in production")
