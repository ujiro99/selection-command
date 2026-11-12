import { Storage } from "@/services/storage"
import type { BaseBackupManager } from "@/services/storage/backupManager"

// Back up the commands if the manager's schedule says it is due.
// Never throws, so callers may run it without awaiting.
const checkAndPerformBackup = async (
  manager: BaseBackupManager,
  label: string,
) => {
  try {
    if (await manager.shouldBackup()) {
      await manager.performBackup()
    }
  } catch (error) {
    console.error(`Failed to perform ${label} backup check:`, error)
  }
}

export const checkAndPerformDailyBackup = () =>
  checkAndPerformBackup(Storage.dailyBackupManager, "daily")

export const checkAndPerformWeeklyBackup = () =>
  checkAndPerformBackup(Storage.weeklyBackupManager, "weekly")

export const checkAndPerformLegacyBackup = () =>
  checkAndPerformBackup(Storage.legacyBackupManager, "legacy")
