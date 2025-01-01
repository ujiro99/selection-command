import { useState, useEffect } from 'react'
import { Settings } from '../services/settings'
import type { SettingsType, PageRule } from '@/types'
import { isEmpty } from '@/lib/utils'
import { STYLE, STARTUP_METHOD } from '@/const'
import Default from '@/services/defaultSettings'

type useSettingReturn = {
  settings: SettingsType
  pageRule: PageRule | undefined
}

const emptySettings: SettingsType = {
  settingVersion: '0.0.0',
  commands: [],
  folders: [],
  pageRules: [],
  style: STYLE.HORIZONTAL,
  popupPlacement: 'top',
  linkCommand: Default.linkCommand,
  userStyles: [],
  startupMethod: { method: STARTUP_METHOD.TEXT_SELECTION },
  stars: [],
}

export function useSetting(): useSettingReturn {
  const [settings, setSettings] = useState<SettingsType>(emptySettings)

  useEffect(() => {
    updateSettings()
    Settings.addChangedListener(updateSettings)
    return () => {
      Settings.removeChangedListener(updateSettings)
    }
  }, [])

  const updateSettings = async () => {
    const caches = await Settings.getCaches()
    const data = await Settings.get()
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
    pageRule = settings.pageRules
      .filter((r) => !isEmpty(r.urlPattern))
      .find((rule) => {
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
