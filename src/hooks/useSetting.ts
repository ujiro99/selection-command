import { useState, useEffect } from 'react'
import { UserSettings } from '../services/userSettings'
import type { UserSettingsType, PageRule } from '../services/userSettings'
import { isEmpty } from '@/services/util'
import { STYLE } from '@/const'

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
      const caches = await UserSettings.getCaches()
      const data = await UserSettings.get()
      // use image cache if available
      for (const command of data.commands) {
        const cache = caches.images[command.iconUrl]
        if (!isEmpty(cache)) {
          command.iconUrl = cache
        }
      }
      for (const folder of data.folders) {
        if (!folder.iconUrl) {
          continue
        }
        const cache = caches.images[folder.iconUrl]
        if (!isEmpty(cache)) {
          folder.iconUrl = cache
        }
      }
      setSettings(data)
    })()
    UserSettings.onChanged(setSettings)
  }, [])

  let pageRule: PageRule | undefined
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
