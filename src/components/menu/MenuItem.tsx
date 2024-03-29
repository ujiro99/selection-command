import React, { useState, useRef, useContext } from 'react'
import classNames from 'classnames'
import { context } from '../App'
import { Ipc, BgCommand } from '../../services/ipc'
import { Tooltip } from '../Tooltip'
import {
  button,
  item,
  itemImg,
  itemTitle,
  itemOnlyIcon,
  itemHorizontal,
  apiIconLoading,
  apiIconSuccess,
  apiIconError,
} from '../Menu.module.css'
import { Icon } from '../Icon'
import { OPEN_MODE } from '../../const'
import { Command } from '../../services/userSettings'
import { sleep } from '../../services/util'

type MenuItemProps = {
  url: string
  menuRef: React.RefObject<Element>
  onlyIcon: boolean
  command: Command
}

enum SendState {
  NONE,
  SENDING,
  SUCCESS,
  FAIL,
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const elmRef = useRef(null)
  const [sendState, setSendState] = useState<SendState>(SendState.NONE)
  const onlyIcon = props.onlyIcon
  const { openMode, openModeSecondary, iconUrl, title } = props.command
  const { selectionText } = useContext(context)

  function handleClick(e: React.MouseEvent) {
    let mode = openMode
    if (e.ctrlKey && openModeSecondary) {
      mode = openModeSecondary
    }

    if (mode === OPEN_MODE.POPUP) {
      if (props.menuRef.current) {
        const rect = props.menuRef.current.getBoundingClientRect()
        console.debug('open popup', rect)
        Ipc.send(BgCommand.openPopup, {
          commandId: props.command.id,
          url: props.url,
          top: Math.floor(window.screenTop + rect.top),
          left: Math.floor(window.screenLeft + rect.right + 10),
          height: props.command.popupOption?.height,
          width: props.command.popupOption?.width,
        })
      }
    } else if (mode === OPEN_MODE.TAB) {
      const background = e.ctrlKey && !openModeSecondary
      Ipc.send(BgCommand.openTab, {
        url: props.url,
        active: !background,
      })
    } else if (mode === OPEN_MODE.API) {
      if (sendState !== SendState.NONE) {
        return
      }
      setSendState(SendState.SENDING)

      Ipc.send(BgCommand.execApi, {
        url: props.url,
        pageUrl: window.location.href,
        pageTitle: document.title,
        selectionText: selectionText,
        fetchOptions: props.command.fetchOptions,
        variables: props.command.variables,
      })
        .then(({ ok, res }) => {
          if (ok) {
            setSendState(SendState.SUCCESS)
          } else {
            console.error(res)
            setSendState(SendState.FAIL)
          }
          return sleep(1500)
        })
        .then(() => {
          setSendState(SendState.NONE)
        })
    } else if (mode === OPEN_MODE.SIDE_PANEL) {
      Ipc.send(BgCommand.openSidePanel, {
        url: props.url,
      }).then(() => {
        window.addEventListener(
          'click',
          () => Ipc.send(BgCommand.disableSidePanel),
          {
            once: true,
          },
        )
      })
    }
    e.stopPropagation()
  }

  return (
    <>
      <button
        className={classNames(item, button, {
          [itemOnlyIcon]: onlyIcon,
          [itemHorizontal]: onlyIcon,
        })}
        ref={elmRef}
        onClick={handleClick}
      >
        <ImageStatus status={sendState} iconUrl={iconUrl} />
        <span className={itemTitle}>{title}</span>
      </button>
      {onlyIcon && <Tooltip positionRef={elmRef}>{title}</Tooltip>}
    </>
  )
}

type ImageStatusProps = {
  status: SendState
  iconUrl: string
}

function ImageStatus(props: ImageStatusProps): JSX.Element {
  const { iconUrl, status } = props
  return (
    <>
      {status === SendState.NONE && <img className={itemImg} src={iconUrl} />}
      {status === SendState.SENDING && (
        <Icon
          className={itemImg + ' ' + apiIconLoading + ' rotate'}
          name="refresh"
        />
      )}
      {status === SendState.SUCCESS && (
        <Icon className={itemImg + ' ' + apiIconSuccess} name="check" />
      )}
      {status === SendState.FAIL && (
        <Icon className={itemImg + ' ' + apiIconError} name="error" />
      )}
    </>
  )
}
