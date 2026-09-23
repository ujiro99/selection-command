import { useState } from "react"
import { Dialog } from "./Dialog"
import { t } from "@/services/i18n"
import { Download, Upload, Undo2, RotateCcw } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TEST_IDS } from "@/testIds"
import { useImportExport } from "@/hooks/option/useImportExport"
import {
  BACKUP_TYPES,
  isCheckingBackups,
  hasAvailableBackup,
  getAvailableBackups,
} from "@/services/settings/importExport"
import type { BackupType } from "@/services/settings/importExport"

import css from "./Option.module.css"

const getBackupTypeLabel = (type: BackupType) => {
  switch (type) {
    case BACKUP_TYPES.LEGACY:
      return t("Option_RestoreFromBackup_legacy")
    case BACKUP_TYPES.DAILY:
      return t("Option_RestoreFromBackup_daily")
    case BACKUP_TYPES.WEEKLY:
      return t("Option_RestoreFromBackup_weekly")
  }
}

export function ImportExport() {
  const [resetDialog, setResetDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [restoreDialog, setRestoreDialog] = useState(false)
  const {
    importJson,
    backupStatus,
    selectedBackupType,
    setSelectedBackupType,
    reset,
    exportSettings,
    selectImportFile,
    runImport,
    restore,
  } = useImportExport()
  const availableBackups = getAvailableBackups(backupStatus)

  const handleResetClose = (ret: boolean) => {
    if (ret) reset()
    setResetDialog(false)
  }

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) selectImportFile(file)
  }

  const handleImportClose = (ret: boolean) => {
    if (ret) runImport()
    setImportDialog(false)
  }

  const handleRestoreClose = (ret: boolean) => {
    if (ret) restore()
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
          data-testid={TEST_IDS.importButton}
        >
          <Download size={18} className="mr-2 stroke-gray-600" />
          {t("Option_Import")}
        </button>
        <button
          onClick={exportSettings}
          className={css.menuButton}
          type="button"
          data-testid={TEST_IDS.exportButton}
        >
          <Upload size={18} className="mr-2 stroke-gray-600" />
          {t("Option_Export")}
        </button>
        <button
          onClick={() => setRestoreDialog(true)}
          className={css.menuButton}
          type="button"
          title={
            isCheckingBackups(backupStatus)
              ? t("Option_RestoreFromBackup_checking")
              : !hasAvailableBackup(backupStatus)
                ? t("Option_RestoreFromBackup_no_backup")
                : t("Option_RestoreFromBackup_tooltip")
          }
        >
          <RotateCcw size={18} className="mr-2 stroke-gray-600" />
          {t("Option_RestoreFromBackup")}
        </button>
        <button
          onClick={() => setResetDialog(true)}
          className={css.menuButton}
          type="button"
          data-testid={TEST_IDS.resetButton}
        >
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
        okDisabled={importJson == null}
      >
        <input
          type="file"
          name="settings"
          accept=".json"
          onChange={handleImportFileChange}
          className={`${css.buttonImport}`}
          data-testid={TEST_IDS.importFileInput}
        />
      </Dialog>
      <Dialog
        open={restoreDialog}
        onClose={handleRestoreClose}
        title={t("Option_RestoreFromBackup_dialog_title")}
        description={() =>
          availableBackups.length === 0 ? (
            <span>{t("Option_RestoreFromBackup_dialog_no_data")}</span>
          ) : (
            <span>{t("Option_RestoreFromBackup_dialog_select")}</span>
          )
        }
        okText={t("Option_RestoreFromBackup_dialog_restore")}
        okDisabled={!hasAvailableBackup(backupStatus)}
      >
        {availableBackups.length > 0 && (
          <div>
            <RadioGroup
              value={selectedBackupType}
              onValueChange={(value) =>
                setSelectedBackupType(value as BackupType)
              }
            >
              {availableBackups.map(([type, backup]) => (
                <div key={type} className="flex items-start space-x-3">
                  <RadioGroupItem value={type} className="mt-1" />
                  <div className="flex-1">
                    <label
                      className="text-sm font-medium cursor-pointer"
                      onClick={() => setSelectedBackupType(type)}
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
        )}
      </Dialog>
    </>
  )
}
