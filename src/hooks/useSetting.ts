import { useState, useEffect } from 'react'
import { UserSettingsType, PageRule } from '../services/userSettings'
import { Storage, STORAGE_KEY } from '../services/storage'
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
    const getSettings = async () => {
      const data = await Storage.get<UserSettingsType>(STORAGE_KEY.USER)
      setSettings(data)
    }
    getSettings()
    Storage.addListener(STORAGE_KEY.USER, setSettings)
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
