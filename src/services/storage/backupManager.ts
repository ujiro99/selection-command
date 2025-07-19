import { Command, CommandFolder } from "@/types"
import { LOCAL_STORAGE_KEY, BaseStorage, STORAGE_KEY } from "./index"
import { CommandStorage } from "@/services/storage/commandStorage"

export interface BackupData {
  version: string
  timestamp: number
  commands: Command[]
  folders: CommandFolder[]
}

export abstract class BaseBackupManager {
  protected abstract readonly BACKUP_KEY: LOCAL_STORAGE_KEY
  protected abstract readonly BACKUP_INTERVAL_MS: number
  protected abstract readonly VERSION: string

  async shouldBackup(): Promise<boolean> {
    try {
      const lastBackup = await this.getLastBackupData()
      if (!lastBackup) {
        return true
      }

      const now = Date.now()
      const timeSinceLastBackup = now - lastBackup.timestamp
      return timeSinceLastBackup >= this.BACKUP_INTERVAL_MS
    } catch (error) {
      console.error("Failed to check backup schedule:", error)
      return true
    }
  }

  async performBackup(): Promise<void> {
    try {
      const commandStorage = new CommandStorage()
      const commands = await commandStorage.loadCommands()

      // Get folders from settings directly from storage to avoid circular dependency
      const userSettings = (await BaseStorage.get(STORAGE_KEY.USER)) as {
        folders?: CommandFolder[]
      }
      const folders = userSettings?.folders || []

      if (commands.length === 0 && folders.length === 0) {
        console.debug("No commands or folders to backup")
        return
      }

      const backup: BackupData = {
        version: this.VERSION,
        timestamp: Date.now(),
        commands: commands,
        folders: folders,
      }

      await BaseStorage.set(this.BACKUP_KEY, backup)

      console.debug(
        `${this.VERSION} backup completed: ${commands.length} commands and ${folders.length} folders backed up`,
      )
    } catch (error) {
      console.error(`Failed to perform ${this.VERSION} backup:`, error)
    }
  }

  async getLastBackupData(): Promise<BackupData | null> {
    try {
      const backup = await BaseStorage.get<BackupData>(this.BACKUP_KEY)

      if (backup && backup.timestamp && Array.isArray(backup.commands)) {
        return {
          version: backup.version,
          timestamp: backup.timestamp,
          commands: backup.commands,
          folders: Array.isArray(backup.folders) ? backup.folders : [],
        }
      }
      return null
    } catch (error) {
      console.error("Failed to get last backup data:", error)
      return null
    }
  }

  async restoreFromBackup(): Promise<{
    commands: Command[]
    folders: CommandFolder[]
  }> {
    try {
      const backup = await this.getLastBackupData()
      if (!backup) {
        return { commands: [], folders: [] }
      }

      return {
        commands: backup.commands || [],
        folders: backup.folders || [],
      }
    } catch (error) {
      console.error("Failed to restore from backup:", error)
      return { commands: [], folders: [] }
    }
  }

  async getLastBackupDate(): Promise<Date | null> {
    const backup = await this.getLastBackupData()
    return backup ? new Date(backup.timestamp) : null
  }
}

// Daily backup management class
export class DailyBackupManager extends BaseBackupManager {
  protected readonly BACKUP_KEY = LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP
  protected readonly BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours
  protected readonly VERSION = "daily"

  // 既存のメソッド名を保持するためのエイリアス
  async performDailyBackup(): Promise<void> {
    return this.performBackup()
  }

  async restoreFromDailyBackup(): Promise<{
    commands: Command[]
    folders: CommandFolder[]
  }> {
    return this.restoreFromBackup()
  }
}

// Weekly backup management class
export class WeeklyBackupManager extends BaseBackupManager {
  protected readonly BACKUP_KEY = LOCAL_STORAGE_KEY.WEEKLY_COMMANDS_BACKUP
  protected readonly BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
  protected readonly VERSION = "weekly"

  async performWeeklyBackup(): Promise<void> {
    return this.performBackup()
  }

  async restoreFromWeeklyBackup(): Promise<{
    commands: Command[]
    folders: CommandFolder[]
  }> {
    return this.restoreFromBackup()
  }
}

// Legacy backup management class (for migration purposes)
export class LegacyBackupManager extends BaseBackupManager {
  protected readonly BACKUP_KEY = LOCAL_STORAGE_KEY.COMMANDS_BACKUP
  protected readonly BACKUP_INTERVAL_MS = 0 // Never auto-backup (manual only)
  protected readonly VERSION = "legacy"

  async performLegacyBackup(): Promise<void> {
    return this.performBackup()
  }

  async restoreFromLegacyBackup(): Promise<{
    commands: Command[]
    folders: CommandFolder[]
  }> {
    return this.restoreFromBackup()
  }

  // Migration-specific method that backs up given commands (not from storage)
  async backupCommandsForMigration(commands: Command[]): Promise<void> {
    try {
      // Get folders from settings directly from storage to avoid circular dependency
      const userSettings = (await BaseStorage.get(STORAGE_KEY.USER)) as {
        folders?: CommandFolder[]
      }
      const folders = userSettings?.folders || []

      const backup: BackupData = {
        version: this.VERSION,
        timestamp: Date.now(),
        commands: commands,
        folders: folders,
      }

      await BaseStorage.set(this.BACKUP_KEY, backup)

      console.debug(
        `Legacy migration backup completed: ${commands.length} commands and ${folders.length} folders backed up`,
      )
    } catch (error) {
      console.error(`Failed to perform legacy migration backup:`, error)
    }
  }
}
