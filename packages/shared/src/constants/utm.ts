/**
 * Centralized `utm_source` values for outbound links (e.g. to Command Hub
 * or the Chrome Web Store). Reuse these instead of writing raw strings so
 * link locations stay consistent and typo-free.
 */
export const UTM_SOURCE = {
  OPTION_PAGE: "option-page",
  EXTENSION: "extension",
  ONBOARDING: "onboarding",
} as const
export type UtmSource = (typeof UTM_SOURCE)[keyof typeof UTM_SOURCE]

/**
 * Centralized `utm_medium` values for outbound links.
 */
export const UTM_MEDIUM = {
  LINK: "link",
  BUTTON: "button",
  BANNER: "banner",
  TOAST: "toast",
} as const
export type UtmMedium = (typeof UTM_MEDIUM)[keyof typeof UTM_MEDIUM]
