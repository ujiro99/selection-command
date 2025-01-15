import { useState, useRef } from 'react'
import { Dialog } from './Dialog'
import type { SettingsType } from '@/types'

import { Storage, STORAGE_KEY } from '@/services/storage'
import { Settings, migrate } from '@/services/settings'
import { isBase64, isUrl } from '@/lib/utils'
import { APP_ID } from '@/const'
import { t } from '@/services/i18n'

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
  const [importJson, setImportJson] = useState<SettingsType>()
  const inputFile = useRef<HTMLInputElement>(null)

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
    const data = await Storage.get<SettingsType>(STORAGE_KEY.USER)
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
      ;(async () => {
        const data = await migrate(importJson)
        await Settings.set(data)
        location.reload()
      })()
    }
    setImportDialog(false)
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
          {t('Option_Import')}
        </button>
        <button onClick={handleExport} className={css.menuButton} type="button">
          {t('Option_Export')}
        </button>
        <button onClick={handleReset} className={css.menuButton} type="button">
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
    </>
  )
}
