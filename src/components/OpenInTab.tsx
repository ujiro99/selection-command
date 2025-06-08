import { useEffect, useState } from 'react'
import { Ipc, BgCommand } from '@/services/ipc'
import { Icon } from '../components/Icon'
import './OpenInTab.css'

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
      Ipc.send(BgCommand.onFocusLost)
    }
    if (enableOpenInTab) {
      window.addEventListener('blur', onBlur)
    }
    return () => {
      window.removeEventListener('blur', onBlur)
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
