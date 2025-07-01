import { CMD_PREFIX, STORAGE_KEY, LOCAL_STORAGE_KEY } from './storage'

export interface StorageUsageData {
  sync: {
    total: number
    used: number
    free: number
    system: number
    commands: number
    systemPercent: number
    commandsPercent: number
    freePercent: number
  }
  local: {
    total: number
    used: number
    free: number
    system: number
    backup: number
    commands: number
    systemPercent: number
    backupPercent: number
    commandsPercent: number
    freePercent: number
  }
}

export const getStorageUsage = async (): Promise<StorageUsageData> => {
  try {
    const syncSystemKeys = Object.values(STORAGE_KEY).map((key) => String(key))
    const syncSystemBytes = await new Promise<number>((resolve) => {
      chrome.storage.sync.getBytesInUse(syncSystemKeys, (bytes) => {
        resolve(bytes)
      })
    })

    const allSyncData = await chrome.storage.sync.get(null)
    const syncCommandKeys = Object.keys(allSyncData || {}).filter((key) =>
      key.startsWith(CMD_PREFIX),
    )

    const syncCommandBytes =
      syncCommandKeys.length > 0
        ? await new Promise<number>((resolve) => {
            chrome.storage.sync.getBytesInUse(syncCommandKeys, (bytes) => {
              resolve(bytes)
            })
          })
        : 0

    const syncTotalBytes = await new Promise<number>((resolve) => {
      chrome.storage.sync.getBytesInUse(null, (bytes) => {
        resolve(bytes)
      })
    })

    const allLocalData = await chrome.storage.local.get(null)

    const localSystemKeys = Object.values(LOCAL_STORAGE_KEY).filter(
      (key) => key !== LOCAL_STORAGE_KEY.COMMANDS_BACKUP,
    ) as string[]
    const localBackupKeys = [LOCAL_STORAGE_KEY.COMMANDS_BACKUP] as string[]
    const localCommandKeys = Object.keys(allLocalData || {}).filter((key) =>
      key.startsWith(CMD_PREFIX),
    )

    const localSystemBytes =
      localSystemKeys.length > 0
        ? await new Promise<number>((resolve) => {
            chrome.storage.local.getBytesInUse(localSystemKeys, (bytes) => {
              resolve(bytes)
            })
          })
        : 0

    const localBackupBytes =
      localBackupKeys.length > 0
        ? await new Promise<number>((resolve) => {
            chrome.storage.local.getBytesInUse(localBackupKeys, (bytes) => {
              resolve(bytes)
            })
          })
        : 0

    const localCommandBytes =
      localCommandKeys.length > 0
        ? await new Promise<number>((resolve) => {
            chrome.storage.local.getBytesInUse(localCommandKeys, (bytes) => {
              resolve(bytes)
            })
          })
        : 0

    const localTotalBytes = await new Promise<number>((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        resolve(bytes)
      })
    })

    const syncLimitTotal = 100 * 1024 // 100KB
    const localLimitTotal = 10 * 1024 * 1024 // 10MB

    const syncUsed = syncTotalBytes
    const syncFree = syncLimitTotal - syncUsed
    const localUsed = localTotalBytes
    const localFree = localLimitTotal - localUsed

    return {
      sync: {
        total: syncLimitTotal,
        used: syncUsed,
        free: syncFree,
        system: syncSystemBytes,
        commands: syncCommandBytes,
        systemPercent: Number(
          ((syncSystemBytes / syncLimitTotal) * 100).toFixed(1),
        ),
        commandsPercent: Number(
          ((syncCommandBytes / syncLimitTotal) * 100).toFixed(1),
        ),
        freePercent: Number(((syncFree / syncLimitTotal) * 100).toFixed(1)),
      },
      local: {
        total: localLimitTotal,
        used: localUsed,
        free: localFree,
        system: localSystemBytes,
        backup: localBackupBytes,
        commands: localCommandBytes,
        systemPercent: Number(
          ((localSystemBytes / localLimitTotal) * 100).toFixed(1),
        ),
        backupPercent: Number(
          ((localBackupBytes / localLimitTotal) * 100).toFixed(1),
        ),
        commandsPercent: Number(
          ((localCommandBytes / localLimitTotal) * 100).toFixed(1),
        ),
        freePercent: Number(((localFree / localLimitTotal) * 100).toFixed(1)),
      },
    }
  } catch (error) {
    console.error('Failed to get storage usage:', error)
    throw error
  }
}
