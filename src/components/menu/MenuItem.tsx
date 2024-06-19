import React, { useState, useRef, useContext } from 'react'
import classNames from 'classnames'
import { context } from '@/components/App'
import { actions } from '@/action'
import { Ipc, BgCommand } from '@/services/ipc'
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
} from './Menu.module.css'
import { Icon } from '../Icon'
import { OPEN_MODE } from '../../const'
import type { Command } from '@/services/userSettings'
import { toUrl, sleep, linksInSelection } from '../../services/util'

type MenuItemProps = {
  menuRef: React.RefObject<Element>
  onlyIcon: boolean
  command: Command
}

enum SendState {
  NONE = 0,
  SENDING = 1,
  SUCCESS = 2,
  FAIL = 3,
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const elmRef = useRef(null)
  const [sendState, setSendState] = useState<SendState>(SendState.NONE)
  const onlyIcon = props.onlyIcon
  const { openMode, openModeSecondary, iconUrl, title: _title } = props.command
  const { selectionText } = useContext(context)
  let title = _title
  let enable = true
  let links: string[]

  if (openMode === OPEN_MODE.LINK_POPUP) {
    links = linksInSelection()
    console.debug('links', links)
    enable = links.length > 0
    title = `${links.length} links`
  }

  function handleClick(e: React.MouseEvent) {
    let mode = openMode
    if (e.ctrlKey && openModeSecondary) {
      mode = openModeSecondary
    }

    const url = toUrl(props.command.searchUrl, selectionText)

    if (mode === OPEN_MODE.POPUP) {
      actions[OPEN_MODE.POPUP].execute({
        urls: [url],
        command: props.command,
        menuElm: props.menuRef.current,
      })
    } else if (mode === OPEN_MODE.TAB) {
      actions[OPEN_MODE.TAB].execute({
        urls: [url],
        command: props.command,
        menuElm: props.menuRef.current,
        e,
      })
    } else if (mode === OPEN_MODE.API) {
      if (sendState !== SendState.NONE) {
        return
      }
      setSendState(SendState.SENDING)

      Ipc.send(BgCommand.execApi, {
        url: url,
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
    } else if (mode === OPEN_MODE.LINK_POPUP) {
      actions[OPEN_MODE.LINK_POPUP].execute({
        urls: links,
        command: props.command,
        menuElm: props.menuRef.current,
      })
    }
    e.stopPropagation()
  }

  return (
    <>
      <button
        type="button"
        className={classNames(item, button, {
          [itemOnlyIcon]: onlyIcon,
          [itemHorizontal]: onlyIcon,
        })}
        ref={elmRef}
        onClick={handleClick}
        disabled={!enable}
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
      {status === SendState.NONE && (
        <img className={itemImg} src={iconUrl} alt="icon" />
      )}
      {status === SendState.SENDING && (
        <Icon
          className={`${itemImg} ${apiIconLoading} rotate`}
          name="refresh"
        />
      )}
      {status === SendState.SUCCESS && (
        <Icon className={`${itemImg} ${apiIconSuccess}`} name="check" />
      )}
      {status === SendState.FAIL && (
        <Icon className={`${itemImg} ${apiIconError}`} name="error" />
      )}
    </>
  )
}
