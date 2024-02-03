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
  apiIcon,
  apiIconLoading,
  apiIconError,
} from '../Menu.module.css'
import { Icon } from '../Icon'
import { OPEN_MODE } from '../../const'
import { Command } from '../../services/userSettings'
import { sleep } from '../../services/util'

type MenuItemProps = {
  title: string
  url: string
  iconUrl: string
  openMode: OPEN_MODE
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
  const { selectionText } = useContext(context)

  function handleClick() {
    if (props.openMode === OPEN_MODE.POPUP) {
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
    } else if (props.openMode === OPEN_MODE.API) {
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
          return sleep(1000)
        })
        .then(() => {
          setSendState(SendState.NONE)
        })
    } else if (props.openMode === OPEN_MODE.SIDE_PANEL) {
      Ipc.send(BgCommand.openSidePanel, {
        url: props.url,
      }).then(() => {
        const func = () => {
          Ipc.send(BgCommand.disableSidePanel)
          window.removeEventListener('click', func)
        }
        window.addEventListener('click', func)
      })
    }
  }

  if (props.openMode === OPEN_MODE.POPUP) {
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
          <img className={itemImg} src={props.iconUrl} />
          <span className={itemTitle}>{props.title}</span>
        </button>
        {onlyIcon && <Tooltip positionRef={elmRef}>{props.title}</Tooltip>}
      </>
    )
  }

  if (props.openMode === OPEN_MODE.API) {
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
          {sendState === SendState.NONE && (
            <img className={itemImg} src={props.iconUrl} />
          )}
          {sendState === SendState.SENDING && (
            <Icon
              className={itemImg + ' ' + apiIconLoading + ' rotate'}
              name="refresh"
            />
          )}
          {sendState === SendState.SUCCESS && (
            <Icon className={itemImg + ' ' + apiIcon} name="check" />
          )}
          {sendState === SendState.FAIL && (
            <Icon className={itemImg + ' ' + apiIconError} name="error" />
          )}
          <span className={itemTitle}>{props.title}</span>
        </button>
        {onlyIcon && <Tooltip positionRef={elmRef}>{props.title}</Tooltip>}
      </>
    )
  }

  if (props.openMode === OPEN_MODE.SIDE_PANEL) {
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
          <img className={itemImg} src={props.iconUrl} />
          <span className={itemTitle}>{props.title}</span>
        </button>
        {onlyIcon && <Tooltip positionRef={elmRef}>{props.title}</Tooltip>}
      </>
    )
  }

  return (
    <a
      href={props.url}
      className={classNames(item, {
        [itemOnlyIcon]: onlyIcon,
        [itemHorizontal]: onlyIcon,
      })}
      ref={elmRef}
      target="_blank"
      onClick={handleClick}
    >
      <img className={itemImg} src={props.iconUrl} />
      <span className={itemTitle}>{props.title}</span>
      {onlyIcon && <Tooltip positionRef={elmRef}>{props.title}</Tooltip>}
    </a>
  )
}
