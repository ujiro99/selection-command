import type { UserSettings, Caches, ShortcutSettings } from "@/types"
import { Storage, STORAGE_KEY, LOCAL_STORAGE_KEY } from "@/services/storage"
import {
  DailyBackupManager,
  WeeklyBackupManager,
  LegacyBackupManager,
} from "@/services/storage/backupManager"
import type {
  BackupData,
  BaseBackupManager,
} from "@/services/storage/backupManager"
import { Settings, migrate } from "@/services/settings/settings"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { isBase64, isUrl } from "@/lib/utils"
import { APP_ID } from "@/const"

// Backup type constants
export const BACKUP_TYPES = {
  LEGACY: "legacy",
  DAILY: "daily",
  WEEKLY: "weekly",
} as const

// Backup status constants
export const BACKUP_STATUS = {
  CHECKING: "checking",
  AVAILABLE: "available",
  NONE: "none",
} as const

export type BackupType = (typeof BACKUP_TYPES)[keyof typeof BACKUP_TYPES]
export type BackupStatus = (typeof BACKUP_STATUS)[keyof typeof BACKUP_STATUS]

export type BackupInfo = {
  timestamp: number
  commandCount: number
  folderCount?: number
}

export type BackupEntry = {
  status: BackupStatus
  info: BackupInfo | null
}

export type BackupStatusMap = Record<BackupType, BackupEntry>

// Order used to pick the default backup selection.
const BACKUP_PRIORITY: BackupType[] = [
  BACKUP_TYPES.LEGACY,
  BACKUP_TYPES.DAILY,
  BACKUP_TYPES.WEEKLY,
]

const createBackupStatusMap = (status: BackupStatus): BackupStatusMap => ({
  [BACKUP_TYPES.LEGACY]: { status, info: null },
  [BACKUP_TYPES.DAILY]: { status, info: null },
  [BACKUP_TYPES.WEEKLY]: { status, info: null },
})

export const INITIAL_BACKUP_STATUS: BackupStatusMap = createBackupStatusMap(
  BACKUP_STATUS.CHECKING,
)

export function getTimestamp(date = new Date()): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${year}${month}${day}_${hours}${minutes}`
}

/**
 * Reset all settings to default.
 */
export async function resetSettings(): Promise<void> {
  await Settings.reset()
}

/**
 * Build the settings data to be exported.
 */
export async function buildExportData(): Promise<UserSettings> {
  const data = await Storage.get<UserSettings>(STORAGE_KEY.USER)
  data.commands = await Storage.getCommands()
  data.shortcuts = await Storage.get<ShortcutSettings>(STORAGE_KEY.SHORTCUTS)

  // for back compatibility
  // cache key to image data url
  const caches = (await enhancedSettings.getSection(
    CACHE_SECTIONS.CACHES,
    true,
  )) as Caches
  for (const c of data.commands) {
    if (!c.iconUrl) continue
    if (isBase64(c.iconUrl) || isUrl(c.iconUrl)) continue
    if (caches?.images?.[c.iconUrl]) {
      c.iconUrl = caches.images[c.iconUrl]
    }
  }
  return data
}

/**
 * Export settings and download them as a json file.
 */
export async function exportSettings(): Promise<void> {
  const data = await buildExportData()
  const text = JSON.stringify(data, null, 2)
  const blob = new Blob([text], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  document.body.appendChild(a)
  a.download = `${APP_ID}_${getTimestamp()}.json`
  a.href = url
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Read a settings json file.
 */
export function readSettingsFile(file: File): Promise<UserSettings> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target == null) return
      try {
        resolve(JSON.parse(e.target.result as string))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * Import settings, keeping the user's local-only states.
 */
export async function importSettings(importJson: UserSettings): Promise<void> {
  const {
    commandExecutionCount = 0,
    hasShownReviewRequest = false,
    hasDismissedPromptHistoryBanner = false,
    hasShownHubShareToast = false,
    hasShownOnboarding = false,
  } = await enhancedSettings.get()
  const data = await migrate({
    ...importJson,
    commandExecutionCount,
    hasShownReviewRequest,
    hasDismissedPromptHistoryBanner,
    hasShownHubShareToast,
    hasShownOnboarding,
    stars: [],
  })
  await Settings.set(data)
}

const toBackupEntry = (backup: BackupData | null | undefined): BackupEntry => {
  // A backup without commands cannot be restored, so treat it as NONE.
  if (backup && Array.isArray(backup.commands) && backup.commands.length > 0) {
    return {
      status: BACKUP_STATUS.AVAILABLE,
      info: {
        timestamp: backup.timestamp,
        commandCount: backup.commands.length,
        folderCount: Array.isArray(backup.folders) ? backup.folders.length : 0,
      },
    }
  }
  return { status: BACKUP_STATUS.NONE, info: null }
}

/**
 * Check the status of each backup.
 */
export async function checkBackupStatus(): Promise<BackupStatusMap> {
  try {
    const legacyBackup = await Storage.get<BackupData>(
      LOCAL_STORAGE_KEY.COMMANDS_BACKUP,
    )
    const dailyBackup = await new DailyBackupManager().getLastBackupData()
    const weeklyBackup = await new WeeklyBackupManager().getLastBackupData()
    return {
      [BACKUP_TYPES.LEGACY]: toBackupEntry(legacyBackup),
      [BACKUP_TYPES.DAILY]: toBackupEntry(dailyBackup),
      [BACKUP_TYPES.WEEKLY]: toBackupEntry(weeklyBackup),
    }
  } catch (error) {
    console.error("Failed to check backup status:", error)
    return createBackupStatusMap(BACKUP_STATUS.NONE)
  }
}

/**
 * Get the first available backup type, or undefined if none is available.
 */
export function getDefaultBackupType(
  statusMap: BackupStatusMap,
): BackupType | undefined {
  return BACKUP_PRIORITY.find(
    (type) => statusMap[type].status === BACKUP_STATUS.AVAILABLE,
  )
}

export function isCheckingBackups(statusMap: BackupStatusMap): boolean {
  return Object.values(statusMap).every(
    (backup) => backup.status === BACKUP_STATUS.CHECKING,
  )
}

export function hasAvailableBackup(statusMap: BackupStatusMap): boolean {
  return Object.values(statusMap).some(
    (backup) => backup.status === BACKUP_STATUS.AVAILABLE,
  )
}

/**
 * Get available backups, with legacy placed at the bottom.
 */
export function getAvailableBackups(
  statusMap: BackupStatusMap,
): Array<[BackupType, BackupEntry]> {
  return (Object.entries(statusMap) as Array<[BackupType, BackupEntry]>)
    .filter(([, backup]) => backup.status === BACKUP_STATUS.AVAILABLE)
    .sort(([typeA], [typeB]) => {
      if (typeA === BACKUP_TYPES.LEGACY) return 1
      if (typeB === BACKUP_TYPES.LEGACY) return -1
      return 0
    })
}

const createBackupManager = (type: BackupType): BaseBackupManager => {
  switch (type) {
    case BACKUP_TYPES.LEGACY:
      return new LegacyBackupManager()
    case BACKUP_TYPES.DAILY:
      return new DailyBackupManager()
    case BACKUP_TYPES.WEEKLY:
      return new WeeklyBackupManager()
  }
}

/**
 * Restore commands and folders from the specified backup.
 * @returns true if commands were restored, false if the backup has no commands.
 */
export async function restoreFromBackup(type: BackupType): Promise<boolean> {
  const data = await createBackupManager(type).restoreFromBackup()

  if (data.folders && data.folders.length > 0) {
    const currentSettings = await enhancedSettings.get()
    await Settings.set({
      ...currentSettings,
      folders: data.folders,
    })
  }

  if (data.commands.length === 0) return false
  await Storage.setCommands(data.commands)
  return true
}
