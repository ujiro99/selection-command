import { useState, useRef, useEffect } from "react"
import { Dialog } from "./Dialog"
import type { UserSettings, Caches } from "@/types"

import {
  Storage,
  STORAGE_KEY,
  LOCAL_STORAGE_KEY,
  CommandMigrationManager,
} from "@/services/storage"
import {
  DailyBackupManager,
  WeeklyBackupManager,
} from "@/services/storage/backupManager"
import { Settings, migrate } from "@/services/settings/settings"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { isBase64, isUrl } from "@/lib/utils"
import { APP_ID } from "@/const"
import { t } from "@/services/i18n"
import { Download, Upload, Undo2, RotateCcw } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { BackupData } from "@/services/storage/backupManager"

import css from "./Option.module.css"

// Backup type constants
const BACKUP_TYPES = {
  LEGACY: "legacy",
  DAILY: "daily",
  WEEKLY: "weekly",
} as const

// Backup status constants
const BACKUP_STATUS = {
  CHECKING: "checking",
  AVAILABLE: "available",
  NONE: "none",
} as const

type BackupType = (typeof BACKUP_TYPES)[keyof typeof BACKUP_TYPES]
type BackupStatus = (typeof BACKUP_STATUS)[keyof typeof BACKUP_STATUS]

function getTimestamp() {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${year}${month}${day}_${hours}${minutes}`
}

export function ImportExport() {
  const [resetDialog, setResetDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [restoreDialog, setRestoreDialog] = useState(false)
  const [importJson, setImportJson] = useState<UserSettings>()
  const [backupData, setBackupData] = useState<{
    [BACKUP_TYPES.LEGACY]: {
      status: BackupStatus
      info: {
        timestamp: number
        commandCount: number
        folderCount?: number
      } | null
    }
    [BACKUP_TYPES.DAILY]: {
      status: BackupStatus
      info: {
        timestamp: number
        commandCount: number
        folderCount?: number
      } | null
    }
    [BACKUP_TYPES.WEEKLY]: {
      status: BackupStatus
      info: {
        timestamp: number
        commandCount: number
        folderCount?: number
      } | null
    }
  }>({
    [BACKUP_TYPES.LEGACY]: { status: BACKUP_STATUS.CHECKING, info: null },
    [BACKUP_TYPES.DAILY]: { status: BACKUP_STATUS.CHECKING, info: null },
    [BACKUP_TYPES.WEEKLY]: { status: BACKUP_STATUS.CHECKING, info: null },
  })
  const [selectedBackupType, setSelectedBackupType] = useState<BackupType>(
    BACKUP_TYPES.LEGACY,
  )
  const inputFile = useRef<HTMLInputElement>(null)

  // Check backup status on initialization
  useEffect(() => {
    checkBackupStatus()
  }, [])

  const checkBackupStatus = async () => {
    try {
      const newBackupData = { ...backupData }

      // 1. Check legacy backup
      const legacyBackup = await Storage.get<BackupData>(
        LOCAL_STORAGE_KEY.COMMANDS_BACKUP,
      )

      if (
        legacyBackup &&
        legacyBackup.commands &&
        Array.isArray(legacyBackup.commands)
      ) {
        newBackupData[BACKUP_TYPES.LEGACY] = {
          status: BACKUP_STATUS.AVAILABLE,
          info: {
            timestamp: legacyBackup.timestamp,
            commandCount: legacyBackup.commands.length,
            folderCount: Array.isArray(legacyBackup.folders)
              ? legacyBackup.folders.length
              : 0,
          },
        }
      } else {
        newBackupData[BACKUP_TYPES.LEGACY] = {
          status: BACKUP_STATUS.NONE,
          info: null,
        }
      }

      // 2. Check daily backup
      const dailyBackupManager = new DailyBackupManager()
      const dailyBackup = await dailyBackupManager.getLastBackupData()

      if (
        dailyBackup &&
        dailyBackup.commands &&
        Array.isArray(dailyBackup.commands)
      ) {
        newBackupData[BACKUP_TYPES.DAILY] = {
          status: BACKUP_STATUS.AVAILABLE,
          info: {
            timestamp: dailyBackup.timestamp,
            commandCount: dailyBackup.commands.length,
            folderCount: Array.isArray(dailyBackup.folders)
              ? dailyBackup.folders.length
              : 0,
          },
        }
      } else {
        newBackupData[BACKUP_TYPES.DAILY] = {
          status: BACKUP_STATUS.NONE,
          info: null,
        }
      }

      // 3. Check weekly backup
      const weeklyBackupManager = new WeeklyBackupManager()
      const weeklyBackup = await weeklyBackupManager.getLastBackupData()

      if (
        weeklyBackup &&
        weeklyBackup.commands &&
        Array.isArray(weeklyBackup.commands)
      ) {
        newBackupData[BACKUP_TYPES.WEEKLY] = {
          status: BACKUP_STATUS.AVAILABLE,
          info: {
            timestamp: weeklyBackup.timestamp,
            commandCount: weeklyBackup.commands.length,
            folderCount: Array.isArray(weeklyBackup.folders)
              ? weeklyBackup.folders.length
              : 0,
          },
        }
      } else {
        newBackupData[BACKUP_TYPES.WEEKLY] = {
          status: BACKUP_STATUS.NONE,
          info: null,
        }
      }

      setBackupData(newBackupData)

      // Set default selection to first available backup
      if (
        newBackupData[BACKUP_TYPES.LEGACY].status === BACKUP_STATUS.AVAILABLE
      ) {
        setSelectedBackupType(BACKUP_TYPES.LEGACY)
      } else if (
        newBackupData[BACKUP_TYPES.DAILY].status === BACKUP_STATUS.AVAILABLE
      ) {
        setSelectedBackupType(BACKUP_TYPES.DAILY)
      } else if (
        newBackupData[BACKUP_TYPES.WEEKLY].status === BACKUP_STATUS.AVAILABLE
      ) {
        setSelectedBackupType(BACKUP_TYPES.WEEKLY)
      }
    } catch (error) {
      console.error("Failed to check backup status:", error)
      setBackupData({
        [BACKUP_TYPES.LEGACY]: { status: BACKUP_STATUS.NONE, info: null },
        [BACKUP_TYPES.DAILY]: { status: BACKUP_STATUS.NONE, info: null },
        [BACKUP_TYPES.WEEKLY]: { status: BACKUP_STATUS.NONE, info: null },
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
      ;(async () => {
        const { commandExecutionCount = 0, hasShownReviewRequest = false } =
          await Settings.get()
        const data = await migrate({
          ...importJson,
          commandExecutionCount,
          hasShownReviewRequest,
          stars: [],
        })
        await Settings.set(data)
        location.reload()
      })()
    }
    setImportDialog(false)
  }

  const handleRestore = async () => {
    setRestoreDialog(true)
  }

  const handleRestoreClose = (ret: boolean) => {
    if (ret) {
      ;(async () => {
        try {
          let backupCommands: any[] = []

          if (selectedBackupType === BACKUP_TYPES.LEGACY) {
            // Restore from legacy backup
            const migrationManager = new CommandMigrationManager()
            const legacyData = await migrationManager.restoreFromBackup()
            backupCommands = legacyData.commands

            if (legacyData.folders && legacyData.folders.length > 0) {
              // Restore folders to settings
              const currentSettings = await Settings.get()
              await Settings.set({
                ...currentSettings,
                folders: legacyData.folders,
              })
            }
          } else if (selectedBackupType === BACKUP_TYPES.DAILY) {
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
          } else if (selectedBackupType === BACKUP_TYPES.WEEKLY) {
            // Restore from weekly backup
            const weeklyBackupManager = new WeeklyBackupManager()
            const weeklyData =
              await weeklyBackupManager.restoreFromWeeklyBackup()
            backupCommands = weeklyData.commands

            if (weeklyData.folders && weeklyData.folders.length > 0) {
              // Restore folders to settings
              const currentSettings = await Settings.get()
              await Settings.set({
                ...currentSettings,
                folders: weeklyData.folders,
              })
            }
          }

          if (backupCommands.length > 0) {
            // Save restored commands
            await Storage.setCommands(backupCommands)
            location.reload()
          } else {
            alert(t("Option_RestoreFromBackup_failed"))
          }
        } catch (error) {
          console.error("Failed to restore from backup:", error)
          alert("Failed to restore from backup.")
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
          {t("Option_Import")}
        </button>
        <button onClick={handleExport} className={css.menuButton} type="button">
          <Upload size={18} className="mr-2 stroke-gray-600" />
          {t("Option_Export")}
        </button>
        <button
          onClick={handleRestore}
          className={css.menuButton}
          type="button"
          title={
            Object.values(backupData).every(
              (backup) => backup.status === BACKUP_STATUS.CHECKING,
            )
              ? t("Option_RestoreFromBackup_checking")
              : !Object.values(backupData).some(
                    (backup) => backup.status === BACKUP_STATUS.AVAILABLE,
                  )
                ? t("Option_RestoreFromBackup_no_backup")
                : t("Option_RestoreFromBackup_tooltip")
          }
        >
          <RotateCcw size={18} className="mr-2 stroke-gray-600" />
          {t("Option_RestoreFromBackup")}
        </button>
        <button onClick={handleReset} className={css.menuButton} type="button">
          <Undo2 size={18} className="mr-2 stroke-gray-600" />
          {t("Option_Reset")}
        </button>
      </div>
      <Dialog
        open={resetDialog}
        onClose={handleResetClose}
        title={"Reset settings?"}
        description={() => (
          <span
            dangerouslySetInnerHTML={{ __html: t("Option_Reset_Description") }}
          />
        )}
        okText={t("Option_Reset")}
      />
      <Dialog
        open={importDialog}
        onClose={handleImportClose}
        title={"Import settings"}
        description={() => (
          <span
            dangerouslySetInnerHTML={{ __html: t("Option_Import_Description") }}
          />
        )}
        okText={t("Option_Import")}
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
        title={t("Option_RestoreFromBackup_dialog_title")}
        description={() => {
          const availableBackups = Object.entries(backupData).filter(
            ([, backup]) => backup.status === BACKUP_STATUS.AVAILABLE,
          )

          if (availableBackups.length === 0) {
            return <span>{t("Option_RestoreFromBackup_dialog_no_data")}</span>
          }

          return <span>{t("Option_RestoreFromBackup_dialog_select")}</span>
        }}
        okText={t("Option_RestoreFromBackup_dialog_restore")}
        okDisabled={
          !Object.values(backupData).some(
            (backup) => backup.status === BACKUP_STATUS.AVAILABLE,
          )
        }
      >
        {(() => {
          const availableBackups = Object.entries(backupData).filter(
            ([, backup]) => backup.status === BACKUP_STATUS.AVAILABLE,
          )

          if (availableBackups.length === 0) {
            return null
          }

          const getBackupTypeLabel = (type: string) => {
            switch (type) {
              case BACKUP_TYPES.LEGACY:
                return t("Option_RestoreFromBackup_legacy")
              case BACKUP_TYPES.DAILY:
                return t("Option_RestoreFromBackup_daily")
              case BACKUP_TYPES.WEEKLY:
                return t("Option_RestoreFromBackup_weekly")
              default:
                return type
            }
          }

          return (
            <div>
              <RadioGroup
                value={selectedBackupType}
                onValueChange={(value) =>
                  setSelectedBackupType(value as typeof selectedBackupType)
                }
              >
                {availableBackups
                  .sort(([typeA], [typeB]) => {
                    // Put legacy at the bottom
                    if (typeA === BACKUP_TYPES.LEGACY) return 1
                    if (typeB === BACKUP_TYPES.LEGACY) return -1
                    return 0
                  })
                  .map(([type, backup]) => (
                    <div key={type} className="flex items-start space-x-3">
                      <RadioGroupItem value={type} className="mt-1" />
                      <div className="flex-1">
                        <label
                          className="text-sm font-medium cursor-pointer"
                          onClick={() =>
                            setSelectedBackupType(
                              type as typeof selectedBackupType,
                            )
                          }
                        >
                          {getBackupTypeLabel(type)}
                        </label>
                        {backup.info && (
                          <div className="text-xs text-gray-600 mt-1">
                            <div>
                              {t("Option_RestoreFromBackup_created")}{" "}
                              {new Date(backup.info.timestamp).toLocaleString()}
                            </div>
                            <div>
                              {t("Option_RestoreFromBackup_commands")}{" "}
                              {backup.info.commandCount}{" "}
                              {t("Option_RestoreFromBackup_items")}
                            </div>
                            {backup.info.folderCount !== undefined && (
                              <div>
                                {t("Option_RestoreFromBackup_folders")}{" "}
                                {backup.info.folderCount}{" "}
                                {t("Option_RestoreFromBackup_items")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </RadioGroup>
              <p className="mt-4 text-sm text-yellow-600">
                <strong>{t("Option_RestoreFromBackup_warning")}</strong>{" "}
                {t("Option_RestoreFromBackup_warning_message")}
              </p>
            </div>
          )
        })()}
      </Dialog>
    </>
  )
}
