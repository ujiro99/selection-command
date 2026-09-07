import { OPEN_MODE, DRAG_OPEN_MODE, ONBOARDING_PAGE_PATH } from "@/const"

// Fired on `window` whenever a command (menu command or link preview) is
// executed, regardless of whether the onboarding page is open. This keeps
// the onboarding step-progression logic decoupled from the core execution
// code paths (executor.ts / useDetectLinkCommand.ts) - those callers only
// need to dispatch the event, they don't know or care who's listening.
export const ONBOARDING_EVENT = {
  COMMAND_EXECUTED: "onboarding:command-executed",
} as const

export type OnboardingCommandExecutedDetail = {
  commandId: string
  commandType: OPEN_MODE | DRAG_OPEN_MODE
}

export function dispatchCommandExecuted(
  detail: OnboardingCommandExecutedDetail,
): void {
  // executeAction() (the sole caller) also runs in the service worker
  // (background.ts), where `window` does not exist. No-op there; the
  // onboarding page always runs in a normal window context.
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent<OnboardingCommandExecutedDetail>(
      ONBOARDING_EVENT.COMMAND_EXECUTED,
      { detail },
    ),
  )
}

// Whether the given page URL is the onboarding page, e.g. to skip analytics
// events for commands executed from within the onboarding flow itself. Only
// matches the onboarding page specifically (not extension pages in general,
// such as the options page).
export function isOnboardingPage(url?: string | null): boolean {
  return url?.includes(ONBOARDING_PAGE_PATH) ?? false
}

export function subscribeCommandExecuted(
  listener: (detail: OnboardingCommandExecutedDetail) => void,
): () => void {
  const handler = (e: Event) => {
    listener((e as CustomEvent<OnboardingCommandExecutedDetail>).detail)
  }
  window.addEventListener(ONBOARDING_EVENT.COMMAND_EXECUTED, handler)
  return () =>
    window.removeEventListener(ONBOARDING_EVENT.COMMAND_EXECUTED, handler)
}
