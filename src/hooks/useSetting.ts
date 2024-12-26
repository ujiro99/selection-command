import { useState, useEffect } from 'react'
import { UserSettings } from '../services/userSettings'
import type { UserSettingsType, PageRule } from '@/types'
import { isEmpty } from '@/lib/utils'
import {
  STYLE,
  STARTUP_METHOD,
  DRAG_OPEN_MODE,
  LINK_COMMAND_ENABLED,
} from '@/const'

type useSettingReturn = {
  settings: UserSettingsType
  pageRule: PageRule | undefined
}

const emptySettings: UserSettingsType = {
  settingVersion: '0.0.0',
  commands: [],
  folders: [],
  pageRules: [],
  style: STYLE.HORIZONTAL,
  popupPlacement: 'top',
  linkCommand: {
    enabled: LINK_COMMAND_ENABLED.ENABLE,
    openMode: DRAG_OPEN_MODE.PREVIEW_POPUP,
    threshold: 150,
    showIndicator: true,
  },
  userStyles: [],
  startupMethod: { method: STARTUP_METHOD.TEXT_SELECTION },
  stars: [],
}

export function useSetting(): useSettingReturn {
  const [settings, setSettings] = useState<UserSettingsType>(emptySettings)

  useEffect(() => {
    updateSettings()
    UserSettings.addChangedListener(updateSettings)
    return () => {
      UserSettings.removeChangedListener(updateSettings)
    }
  }, [])

  const updateSettings = async () => {
    const caches = await UserSettings.getCaches()
    const data = await UserSettings.get()
    // use image cache if available
    data.commands = data.commands.map((c) => {
      const cache = caches.images[c.iconUrl]
      let iconUrl = c.iconUrl
      if (!isEmpty(cache)) {
        iconUrl = cache
      }
      return { ...c, iconUrl }
    })
    data.folders = data.folders.map((f) => {
      if (!f.iconUrl) return f
      const cache = caches.images[f.iconUrl]
      let iconUrl = f.iconUrl
      if (!isEmpty(cache)) {
        iconUrl = cache
      }
      return { ...f, iconUrl }
    })
    setSettings(data)
  }

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
