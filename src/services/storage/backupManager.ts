import { Command } from '@/types'
import { LOCAL_STORAGE_KEY } from './index'
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
      
      if (commands.length === 0) {
        console.debug('No commands to backup')
        return
      }

      const backup = {
        version: 'daily',
        timestamp: Date.now(),
        commands: commands,
      }

      await chrome.storage.local.set({
        [this.DAILY_BACKUP_KEY]: backup,
      })

      console.debug(`Daily backup completed: ${commands.length} commands backed up`)
    } catch (error) {
      console.error('Failed to perform daily backup:', error)
    }
  }

  async getLastBackupData(): Promise<{ version: string; timestamp: number; commands: Command[] } | null> {
    try {
      const result = await chrome.storage.local.get(this.DAILY_BACKUP_KEY)
      const backup = result[this.DAILY_BACKUP_KEY]
      
      if (backup && backup.timestamp && Array.isArray(backup.commands)) {
        return backup
      }
      return null
    } catch (error) {
      console.error('Failed to get last backup data:', error)
      return null
    }
  }

  async getLastBackupDate(): Promise<Date | null> {
    const backup = await this.getLastBackupData()
    return backup ? new Date(backup.timestamp) : null
  }
}