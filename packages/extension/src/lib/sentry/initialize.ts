import { initSentry } from "@/lib/sentry"

// Initialize Sentry for service worker
initSentry().catch((error) => {
  console.error("Failed to initialize Sentry in service worker:", error)
})
