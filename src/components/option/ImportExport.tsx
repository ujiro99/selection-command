import { useState, useRef, useEffect } from 'react'
import { Dialog } from './Dialog'
import type { UserSettings } from '@/types'

import { Storage, STORAGE_KEY, CommandMigrationManager } from '@/services/storage'
import { Settings, migrate } from '@/services/settings'
import { isBase64, isUrl } from '@/lib/utils'
import { APP_ID } from '@/const'
import { t } from '@/services/i18n'
import { Download, Upload, Undo2, RotateCcw } from 'lucide-react'

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
  const [backupInfo, setBackupInfo] = useState<{ timestamp: number; commandCount: number } | null>(null)
  const [backupStatus, setBackupStatus] = useState<'checking' | 'available' | 'none'>('checking')
  const inputFile = useRef<HTMLInputElement>(null)

  // Check backup status on initialization
  useEffect(() => {
    checkBackupStatus()
  }, [])

  const checkBackupStatus = async () => {
    try {
      const result = await chrome.storage.local.get('legacy_commands_backup')
      const backup = result.legacy_commands_backup
      
      if (backup && backup.commands && Array.isArray(backup.commands)) {
        setBackupStatus('available')
      } else {
        setBackupStatus('none')
      }
    } catch (error) {
      console.error('Failed to check backup status:', error)
      setBackupStatus('none')
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
    if (backupStatus !== 'available') {
      return
    }
    
    // Get backup information
    try {
      const result = await chrome.storage.local.get('legacy_commands_backup')
      const backup = result.legacy_commands_backup
      
      if (backup && backup.commands && Array.isArray(backup.commands)) {
        setBackupInfo({
          timestamp: backup.timestamp,
          commandCount: backup.commands.length
        })
        setRestoreDialog(true)
      } else {
        // Handle case when backup doesn't exist
        setBackupStatus('none')
        alert('No backup data found. Backup is only available after migrating from legacy storage format.')
      }
    } catch (error) {
      console.error('Failed to check backup:', error)
      alert('Failed to check backup data.')
    }
  }

  const handleRestoreClose = (ret: boolean) => {
    if (ret && backupInfo != null) {
      ; (async () => {
        const migrationManager = new CommandMigrationManager()
        const backupCommands = await migrationManager.restoreFromBackup()
        
        if (backupCommands.length > 0) {
          // Save restored commands
          await Storage.setCommands(backupCommands)
          location.reload()
        } else {
          alert('Failed to restore from backup.')
        }
      })()
    }
    setRestoreDialog(false)
    setBackupInfo(null)
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
          disabled={backupStatus !== 'available'}
          title={
            backupStatus === 'checking' ? 'Checking backup...' :
            backupStatus === 'none' ? 'No backup available' :
            'Restore commands from backup'
          }
        >
          <RotateCcw size={18} className="mr-2 stroke-gray-600" />
          Restore from Backup
          {backupStatus === 'checking' && <span className="ml-2 text-xs opacity-50">...</span>}
          {backupStatus === 'none' && <span className="ml-2 text-xs opacity-50">(N/A)</span>}
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
        description={() => (
          backupInfo ? (
            <div>
              <p>A backup from the legacy storage migration was found:</p>
              <ul className="mt-2 ml-4 list-disc">
                <li><strong>Created:</strong> {new Date(backupInfo.timestamp).toLocaleString()}</li>
                <li><strong>Commands:</strong> {backupInfo.commandCount} items</li>
              </ul>
              <p className="mt-2 text-sm text-yellow-600">
                <strong>Warning:</strong> This will replace all current commands with the backup data.
              </p>
            </div>
          ) : (
            <span>Loading backup information...</span>
          )
        )}
        okText="Restore"
      />
    </>
  )
}
