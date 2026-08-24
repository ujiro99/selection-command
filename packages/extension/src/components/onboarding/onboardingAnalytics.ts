import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import { SCREEN } from "@/const"

// Thin wrapper so step components never call sendEvent directly - keeps the
// SCREEN.ONBOARDING tag and event names centralized in one place.
export function sendOnboardingEvent(
  name: (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any = {},
) {
  sendEvent(name, params, SCREEN.ONBOARDING)
}
