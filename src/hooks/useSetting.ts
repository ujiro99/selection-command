import { useState, useEffect } from 'react'
import { Settings } from '../services/settings'
import type { SettingsType, PageRule } from '@/types'
import { isEmpty } from '@/lib/utils'
import { STYLE, STARTUP_METHOD, ALIGN, SIDE, INHERIT } from '@/const'
import Default from '@/services/defaultSettings'

type iconUrlMap = Record<number | string, string>

type useSettingReturn = {
  settings: SettingsType
  pageRule: PageRule | undefined
  iconUrls: iconUrlMap
}

const emptySettings: SettingsType = {
  settingVersion: '0.0.0',
  commands: [],
  folders: [],
  pageRules: [],
  style: STYLE.HORIZONTAL,
  popupPlacement: {
    side: SIDE.top,
    align: ALIGN.start,
    alignOffset: 0,
    sideOffset: 0,
  },
  linkCommand: Default.linkCommand,
  userStyles: [],
  startupMethod: { method: STARTUP_METHOD.TEXT_SELECTION },
  stars: [],
  commandExecutionCount: 0,
  hasShownReviewRequest: false,
  shortcuts: { shortcuts: [] },
}

export function useSetting(): useSettingReturn {
  const [settings, setSettings] = useState<SettingsType>(emptySettings)
  const [iconUrls, setIconUrls] = useState<iconUrlMap>({})

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
    // create iconUrl map to getting iconUrl
    const iu = data.commands.reduce(
      (acc, cur) => ({ ...acc, [cur.id]: cur.iconUrl }),
      {},
    )
    setIconUrls(iu)
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

    if (pageRule != null && pageRule.popupPlacement !== INHERIT) {
      settings.popupPlacement = pageRule.popupPlacement
    }
  }

  return {
    settings,
    pageRule,
    iconUrls,
  }
}
