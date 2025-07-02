import { Command, CommandFolder } from '@/types'
import { LOCAL_STORAGE_KEY, BaseStorage, STORAGE_KEY } from './index'
import { HybridCommandStorage } from './commandStorage'

// Daily backup management class
export class DailyBackupManager {
  private readonly DAILY_BACKUP_KEY = LOCAL_STORAGE_KEY.DAILY_COMMANDS_BACKUP
  private readonly BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours

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
      console.error('Failed to check backup schedule:', error)
      return true
    }
  }

  async performDailyBackup(): Promise<void> {
    try {
      const hybridStorage = new HybridCommandStorage()
      const commands = await hybridStorage.loadCommands()

      // Get folders from settings directly from storage to avoid circular dependency
      const userSettings = await BaseStorage.get(STORAGE_KEY.USER) as any
      const folders = userSettings?.folders || []

      if (commands.length === 0 && folders.length === 0) {
        console.debug('No commands or folders to backup')
        return
      }

      const backup = {
        version: 'daily',
        timestamp: Date.now(),
        commands: commands,
        folders: folders,
      }

      await chrome.storage.local.set({
        [this.DAILY_BACKUP_KEY]: backup,
      })

      console.debug(
        `Daily backup completed: ${commands.length} commands and ${folders.length} folders backed up`,
      )
    } catch (error) {
      console.error('Failed to perform daily backup:', error)
    }
  }

  async getLastBackupData(): Promise<{
    version: string
    timestamp: number
    commands: Command[]
    folders?: CommandFolder[]
  } | null> {
    try {
      const result = await chrome.storage.local.get(this.DAILY_BACKUP_KEY)
      const backup = result[this.DAILY_BACKUP_KEY]

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
      console.error('Failed to get last backup data:', error)
      return null
    }
  }

  async restoreFromDailyBackup(): Promise<{
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
      console.error('Failed to restore from daily backup:', error)
      return { commands: [], folders: [] }
    }
  }

  async getLastBackupDate(): Promise<Date | null> {
    const backup = await this.getLastBackupData()
    return backup ? new Date(backup.timestamp) : null
  }
}
