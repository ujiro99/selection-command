import { useState, useEffect } from 'react'
import {
  UserSettings,
  UserSettingsType,
  PageRule,
} from '../services/userSettings'
import { STYLE } from '../const'

type useSettingReturn = {
  settings: UserSettingsType
  pageRule: PageRule | undefined
}

const emptySettings: UserSettingsType = {
  commands: [],
  folders: [],
  pageRules: [],
  style: STYLE.HORIZONTAL,
  popupPlacement: 'top',
}

export function useSetting(): useSettingReturn {
  const [settings, setSettings] = useState<UserSettingsType>(emptySettings)

  useEffect(() => {
    ;(async () => {
      const data = await UserSettings.get()
      setSettings(data)
    })()
    UserSettings.onChanged(setSettings)
  }, [])

  let pageRule
  if (settings != null) {
    pageRule = settings.pageRules.find((rule) => {
      const re = new RegExp(rule.urlPattern)
      return window.location.href.match(re) != null
    })

    if (pageRule != null) {
      settings.popupPlacement = pageRule.popupPlacement
    }
  }

  return {
    settings,
    pageRule,
  }
}
