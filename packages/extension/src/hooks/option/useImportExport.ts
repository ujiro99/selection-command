import { useState, useEffect } from "react"
import type { UserSettings } from "@/types"
import { t } from "@/services/i18n"
import {
  BACKUP_TYPES,
  INITIAL_BACKUP_STATUS,
  checkBackupStatus,
  getDefaultBackupType,
  resetSettings,
  exportSettings,
  readSettingsFile,
  importSettings,
  restoreFromBackup,
} from "@/services/settings/importExport"
import type {
  BackupType,
  BackupStatusMap,
} from "@/services/settings/importExport"

export function useImportExport() {
  const [importJson, setImportJson] = useState<UserSettings>()
  const [backupStatus, setBackupStatus] = useState<BackupStatusMap>(
    INITIAL_BACKUP_STATUS,
  )
  const [selectedBackupType, setSelectedBackupType] = useState<BackupType>(
    BACKUP_TYPES.LEGACY,
  )

  // Check backup status on initialization
  useEffect(() => {
    checkBackupStatus().then((statusMap) => {
      setBackupStatus(statusMap)
      const defaultType = getDefaultBackupType(statusMap)
      if (defaultType) setSelectedBackupType(defaultType)
    })
  }, [])

  const reset = async () => {
    await resetSettings()
    location.reload()
  }

  const selectImportFile = async (file: File) => {
    try {
      setImportJson(await readSettingsFile(file))
    } catch (error) {
      // Clear the previously selected file so that it is not imported by mistake.
      setImportJson(undefined)
      console.error("Failed to read settings file:", error)
      alert("Failed to read settings file.")
    }
  }

  const runImport = async () => {
    if (importJson == null) return
    await importSettings(importJson)
    location.reload()
  }

  const restore = async () => {
    try {
      if (await restoreFromBackup(selectedBackupType)) {
        location.reload()
      } else {
        alert(t("Option_RestoreFromBackup_failed"))
      }
    } catch (error) {
      console.error("Failed to restore from backup:", error)
      alert("Failed to restore from backup.")
    }
  }

  return {
    importJson,
    backupStatus,
    selectedBackupType,
    setSelectedBackupType,
    reset,
    exportSettings,
    selectImportFile,
    runImport,
    restore,
  }
}
