import { useContext } from 'react'
import { context } from '../components/App'
import { UserSettingsType, PageRule } from '../services/userSettings'

type useSettingReturn = {
  settings: UserSettingsType
  pageRule: PageRule | undefined
}

export function useSetting(): useSettingReturn {
  const { settings } = useContext(context)
  const pageRule = settings.pageRules.find((rule) => {
    const re = new RegExp(rule.urlPattern)
    return window.location.href.match(re) != null
  })

  if (pageRule != null) {
    settings.popupPlacement = pageRule.popupPlacement
  }

  return {
    settings,
    pageRule,
  }
}
