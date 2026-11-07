import { Storage } from "@/services/storage"

// Daily backup check function
export const checkAndPerformDailyBackup = async () => {
  try {
    const dailyBackupManager = Storage.dailyBackupManager
    if (await dailyBackupManager.shouldBackup()) {
      await dailyBackupManager.performBackup()
    }
  } catch (error) {
    console.error("Failed to perform daily backup check:", error)
  }
}

// Weekly backup check function
export const checkAndPerformWeeklyBackup = async () => {
  try {
    const weeklyBackupManager = Storage.weeklyBackupManager
    if (await weeklyBackupManager.shouldBackup()) {
      await weeklyBackupManager.performBackup()
    }
  } catch (error) {
    console.error("Failed to perform weekly backup check:", error)
  }
}

// Legacy backup check function
export const checkAndPerformLegacyBackup = async () => {
  try {
    const legacyBackupManager = Storage.legacyBackupManager
    if (await legacyBackupManager.shouldBackup()) {
      await legacyBackupManager.performBackup()
    }
  } catch (error) {
    console.error("Failed to perform legacy backup check:", error)
  }
}
