import { useState, useRef, useEffect } from 'react'
import { Dialog } from './Dialog'
import type { UserSettings } from '@/types'

import { Storage, STORAGE_KEY, CommandMigrationManager } from '@/services/storage'
import { DailyBackupManager } from '@/services/storage/backupManager'
import { Settings, migrate } from '@/services/settings'
import { isBase64, isUrl } from '@/lib/utils'
import { APP_ID } from '@/const'
import { t } from '@/services/i18n'
import { Download, Upload, Undo2, RotateCcw } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import css from './Option.module.css'

function getTimestamp() {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}`
}

export function ImportExport() {
  const [resetDialog, setResetDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [restoreDialog, setRestoreDialog] = useState(false)
  const [importJson, setImportJson] = useState<UserSettings>()
  const [backupData, setBackupData] = useState<{
    legacy: { status: 'checking' | 'available' | 'none'; info: { timestamp: number; commandCount: number; folderCount?: number } | null }
    daily: { status: 'checking' | 'available' | 'none'; info: { timestamp: number; commandCount: number; folderCount?: number } | null }
    weekly?: { status: 'checking' | 'available' | 'none'; info: { timestamp: number; commandCount: number; folderCount?: number } | null }
  }>({
    legacy: { status: 'checking', info: null },
    daily: { status: 'checking', info: null },
  })
  const [selectedBackupType, setSelectedBackupType] = useState<'legacy' | 'daily' | 'weekly'>('legacy')
  const inputFile = useRef<HTMLInputElement>(null)

  // Check backup status on initialization
  useEffect(() => {
    checkBackupStatus()
  }, [])

  const checkBackupStatus = async () => {
    try {
      const newBackupData = { ...backupData }
      
      // Check legacy backup
      const legacyResult = await chrome.storage.local.get('legacy_commands_backup')
      const legacyBackup = legacyResult.legacy_commands_backup
      
      if (legacyBackup && legacyBackup.commands && Array.isArray(legacyBackup.commands)) {
        newBackupData.legacy = {
          status: 'available',
          info: {
            timestamp: legacyBackup.timestamp,
            commandCount: legacyBackup.commands.length,
            folderCount: Array.isArray(legacyBackup.folders) ? legacyBackup.folders.length : 0
          }
        }
      } else {
        newBackupData.legacy = { status: 'none', info: null }
      }

      // Check daily backup
      const dailyBackupManager = new DailyBackupManager()
      const dailyBackup = await dailyBackupManager.getLastBackupData()
      
      if (dailyBackup && dailyBackup.commands && Array.isArray(dailyBackup.commands)) {
        newBackupData.daily = {
          status: 'available',
          info: {
            timestamp: dailyBackup.timestamp,
            commandCount: dailyBackup.commands.length,
            folderCount: Array.isArray(dailyBackup.folders) ? dailyBackup.folders.length : 0
          }
        }
      } else {
        newBackupData.daily = { status: 'none', info: null }
      }
      
      setBackupData(newBackupData)
      
      // Set default selection to first available backup
      if (newBackupData.legacy.status === 'available') {
        setSelectedBackupType('legacy')
      } else if (newBackupData.daily.status === 'available') {
        setSelectedBackupType('daily')
      }
    } catch (error) {
      console.error('Failed to check backup status:', error)
      setBackupData({
        legacy: { status: 'none', info: null },
        daily: { status: 'none', info: null },
      })
    }
  }

  const handleReset = () => {
    setResetDialog(true)
  }

  const handleResetClose = (ret: boolean) => {
    if (ret) {
      Settings.reset().then(() => location.reload())
    }
    setResetDialog(false)
  }

  const handleExport = async () => {
    const data = await Storage.get<UserSettings>(STORAGE_KEY.USER)
    data.commands = await Storage.getCommands()

    // for back compatibility
    // cache key to image data url
    const caches = await Settings.getCaches()
    for (const c of data.commands) {
      if (!c.iconUrl) continue
      if (isBase64(c.iconUrl) || isUrl(c.iconUrl)) continue
      c.iconUrl = caches.images[c.iconUrl]
    }

    const text = JSON.stringify(data, null, 2)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.download = `${APP_ID}_${getTimestamp()}.json`
    a.href = url
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    if (inputFile == null || inputFile.current == null) return
    const files = inputFile.current.files
    if (files == null) return
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target != null) {
          const text = e.target.result as string
          const json = JSON.parse(text)
          setImportJson(json)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleImportClose = (ret: boolean) => {
    if (ret && importJson != null) {
      ; (async () => {
        const { commandExecutionCount = 0, hasShownReviewRequest = false } = await Settings.get()
        const data = await migrate({
          ...importJson,
          commandExecutionCount,
          hasShownReviewRequest,
          stars: []
        })
        await Settings.set(data)
        location.reload()
      })()
    }
    setImportDialog(false)
  }

  const handleRestore = async () => {
    const hasAnyBackup = Object.values(backupData).some(backup => backup.status === 'available')
    
    if (!hasAnyBackup) {
      alert('No backup data found.')
      return
    }
    
    setRestoreDialog(true)
  }

  const handleRestoreClose = (ret: boolean) => {
    if (ret) {
      ; (async () => {
        try {
          let backupCommands: any[] = []
          
          if (selectedBackupType === 'legacy') {
            // Restore from legacy backup
            const migrationManager = new CommandMigrationManager()
            const legacyData = await migrationManager.restoreFromBackupWithFolders()
            backupCommands = legacyData.commands
            
            if (legacyData.folders && legacyData.folders.length > 0) {
              // Restore folders to settings
              const currentSettings = await Settings.get()
              await Settings.set({
                ...currentSettings,
                folders: legacyData.folders,
              })
            }
          } else if (selectedBackupType === 'daily') {
            // Restore from daily backup
            const dailyBackupManager = new DailyBackupManager()
            const dailyData = await dailyBackupManager.restoreFromDailyBackup()
            backupCommands = dailyData.commands
            
            if (dailyData.folders && dailyData.folders.length > 0) {
              // Restore folders to settings
              const currentSettings = await Settings.get()
              await Settings.set({
                ...currentSettings,
                folders: dailyData.folders,
              })
            }
          }
          // Future: handle weekly backup type
          
          if (backupCommands.length > 0) {
            // Save restored commands
            await Storage.setCommands(backupCommands)
            location.reload()
          } else {
            alert('Failed to restore from backup.')
          }
        } catch (error) {
          console.error('Failed to restore from backup:', error)
          alert('Failed to restore from backup.')
        }
      })()
    }
    setRestoreDialog(false)
  }

  return (
    <>
      <div className={css.menu}>
        <p className={css.menuLabel}>
          <span>Import</span>
          <span className={css.menuLabel2}>/</span>
          <span>Export</span>
        </p>
        <button
          onClick={() => setImportDialog(true)}
          className={css.menuButton}
          type="button"
        >
          <Download size={18} className="mr-2 stroke-gray-600" />
          {t('Option_Import')}
        </button>
        <button onClick={handleExport} className={css.menuButton} type="button">
          <Upload size={18} className="mr-2 stroke-gray-600" />
          {t('Option_Export')}
        </button>
        <button 
          onClick={handleRestore} 
          className={css.menuButton} 
          type="button"
          disabled={!Object.values(backupData).some(backup => backup.status === 'available')}
          title={
            Object.values(backupData).every(backup => backup.status === 'checking') ? 'Checking backups...' :
            !Object.values(backupData).some(backup => backup.status === 'available') ? 'No backup available' :
            'Restore commands from backup'
          }
        >
          <RotateCcw size={18} className="mr-2 stroke-gray-600" />
          Restore from Backup
          {Object.values(backupData).every(backup => backup.status === 'checking') && <span className="ml-2 text-xs opacity-50">...</span>}
          {!Object.values(backupData).some(backup => backup.status === 'available') && <span className="ml-2 text-xs opacity-50">(N/A)</span>}
        </button>
        <button onClick={handleReset} className={css.menuButton} type="button">
          <Undo2 size={18} className="mr-2 stroke-gray-600" />
          {t('Option_Reset')}
        </button>
      </div>
      <Dialog
        open={resetDialog}
        onClose={handleResetClose}
        title={'Reset settings?'}
        description={() => (
          <span
            dangerouslySetInnerHTML={{ __html: t('Option_Reset_Description') }}
          />
        )}
        okText={t('Option_Reset')}
      />
      <Dialog
        open={importDialog}
        onClose={handleImportClose}
        title={'Import settings'}
        description={() => (
          <span
            dangerouslySetInnerHTML={{ __html: t('Option_Import_Description') }}
          />
        )}
        okText={t('Option_Import')}
      >
        <input
          type="file"
          name="settings"
          accept=".json"
          onChange={handleImport}
          ref={inputFile}
          className={`${css.buttonImport}`}
        />
      </Dialog>
      <Dialog
        open={restoreDialog}
        onClose={handleRestoreClose}
        title={'Restore from Backup'}
        description={() => {
          const availableBackups = Object.entries(backupData).filter(([, backup]) => backup.status === 'available')
          
          if (availableBackups.length === 0) {
            return <span>No backup data available.</span>
          }
          
          return <span>Select a backup to restore:</span>
        }}
        okText="Restore"
      >
        {(() => {
          const availableBackups = Object.entries(backupData).filter(([, backup]) => backup.status === 'available')
          
          if (availableBackups.length === 0) {
            return null
          }
          
          const getBackupTypeLabel = (type: string) => {
            switch (type) {
              case 'legacy': return 'Legacy Migration'
              case 'daily': return 'Daily Backup'
              case 'weekly': return 'Weekly Backup'
              default: return type
            }
          }
          
          return (
            <div>
              <RadioGroup value={selectedBackupType} onValueChange={(value) => setSelectedBackupType(value as typeof selectedBackupType)}>
                {availableBackups.map(([type, backup]) => (
                  <div key={type} className="flex items-start space-x-3">
                    <RadioGroupItem value={type} className="mt-1" />
                    <div className="flex-1">
                      <label className="text-sm font-medium cursor-pointer" onClick={() => setSelectedBackupType(type as typeof selectedBackupType)}>
                        {getBackupTypeLabel(type)}
                      </label>
                      {backup.info && (
                        <div className="text-xs text-gray-600 mt-1">
                          <div>Created: {new Date(backup.info.timestamp).toLocaleString()}</div>
                          <div>Commands: {backup.info.commandCount} items</div>
                          {backup.info.folderCount !== undefined && (
                            <div>Folders: {backup.info.folderCount} items</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </RadioGroup>
              <p className="mt-4 text-sm text-yellow-600">
                <strong>Warning:</strong> This will replace all current commands with the backup data.
              </p>
            </div>
          )
        })()}
      </Dialog>
    </>
  )
}
