export function getUILanguage(): string {
  const FORCE_LANG = import.meta.env.VITE_FORCE_LANG
  if (import.meta.env.DEV && FORCE_LANG) {
    return FORCE_LANG
  }
  return chrome.i18n.getUILanguage()
}

export function t(key: string, params?: string[]): string {
  if (chrome.i18n) {
    return chrome.i18n.getMessage(key, params)
  }
  return key
}

export function getCurrentLocale(): string {
  return chrome.i18n.getMessage("@@ui_locale")
}
