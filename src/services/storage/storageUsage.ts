import { CMD_PREFIX, STORAGE_KEY, LOCAL_STORAGE_KEY } from "@/services/storage"

export interface StorageUsageData {
  sync: {
    total: number
    used: number
    free: number
    system: number
    commands: number
    reservedRemain: number
    systemPercent: number
    reservedPercent: number
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

export const formatPercentage = (value: number): number => {
  const percentage = value * 100
  return Number(
    percentage >= 10 ? percentage.toFixed(0) : percentage.toFixed(1),
  )
}

const getStorageUsage = async (): Promise<StorageUsageData> => {
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
      (key) =>
        key !== LOCAL_STORAGE_KEY.COMMANDS_BACKUP &&
        key !== LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP &&
        key !== LOCAL_STORAGE_KEY.WEEKLY_COMMANDS_BACKUP,
    ) as string[]

    const localBackupKeys = [
      LOCAL_STORAGE_KEY.COMMANDS_BACKUP,
      LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP,
      LOCAL_STORAGE_KEY.WEEKLY_COMMANDS_BACKUP,
    ] as string[]

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
    const reservedTotal = 40 * 1024 // 40KB reserved for system data
    const localLimitTotal = 10 * 1024 * 1024 // 10MB

    const syncUsed = syncTotalBytes
    const reservedRemain = reservedTotal - syncSystemBytes
    const syncFree = syncLimitTotal - reservedTotal - syncCommandBytes
    const localUsed = localTotalBytes
    const localFree = localLimitTotal - localUsed

    return {
      sync: {
        total: syncLimitTotal,
        used: syncUsed,
        free: syncFree,
        system: syncSystemBytes,
        reservedRemain,
        commands: syncCommandBytes,
        systemPercent: formatPercentage(syncSystemBytes / syncLimitTotal),
        reservedPercent: formatPercentage(reservedRemain / syncLimitTotal),
        commandsPercent: formatPercentage(syncCommandBytes / syncLimitTotal),
        freePercent: formatPercentage(syncFree / syncLimitTotal),
      },
      local: {
        total: localLimitTotal,
        used: localUsed,
        free: localFree,
        system: localSystemBytes,
        backup: localBackupBytes,
        commands: localCommandBytes,
        systemPercent: formatPercentage(localSystemBytes / localLimitTotal),
        backupPercent: formatPercentage(localBackupBytes / localLimitTotal),
        commandsPercent: formatPercentage(localCommandBytes / localLimitTotal),
        freePercent: formatPercentage(localFree / localLimitTotal),
      },
    }
  } catch (error) {
    console.error("Failed to get storage usage:", error)
    throw error
  }
}

export const subscribeStorageUsage = (
  callback: (data: StorageUsageData) => void,
): (() => void) => {
  const listener = async () => {
    try {
      const data = await getStorageUsage()
      callback(data)
    } catch (error) {
      console.error("Failed to get storage usage:", error)
    }
  }

  chrome.storage.onChanged.addListener(listener)
  listener() // Initial call

  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}
