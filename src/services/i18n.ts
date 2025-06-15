export function getUILanguage(): string {
  return chrome.i18n.getUILanguage()
}

export function t(key: string, params?: string[]): string {
  if (chrome.i18n) {
    return chrome.i18n.getMessage(key, params)
  }
  return key
}

export function getCurrentLocale(): string {
  return chrome.i18n.getMessage('@@ui_locale')
}
