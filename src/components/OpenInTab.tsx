import { useEffect, useState } from 'react'
import { Ipc, BgCommand } from '@/services/ipc'
import { Icon } from '../components/Icon'
import './OpenInTab.css'

let isPageUnloading = false

export function OpenInTab(): JSX.Element {
  const [enableOpenInTab, setEnableOpenInTab] = useState(false)

  const onClickOpenTab = () => {
    Ipc.send(BgCommand.openInTab)
  }

  useEffect(() => {
    Ipc.send(BgCommand.canOpenInTab).then((result) => {
      setEnableOpenInTab(result)
    })
  }, [])

  useEffect(() => {
    const onBlur = () => {
      setTimeout(() => {
        // Ignore blur events caused by screen transitions.
        if (!isPageUnloading) {
          Ipc.send(BgCommand.onFocusLost)
        }
      }, 100)
    }

    const onBeforeunload = () => {
      isPageUnloading = true
    }

    if (enableOpenInTab) {
      window.addEventListener('blur', onBlur)
      window.addEventListener('beforeunload', onBeforeunload)
    }
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('beforeunload', onBeforeunload)
    }
  }, [enableOpenInTab])

  return (
    <>
      {enableOpenInTab && (
        <div className="OpenInTab">
          <button
            type="button"
            className="OpenInTab__button"
            onClick={onClickOpenTab}
          >
            <Icon name="open-outline" className="OpenInTab__icon" />
            Open in Tab
          </button>
        </div>
      )}
    </>
  )
}
