import React, { useState, useRef, useContext } from 'react'
import classNames from 'classnames'
import { context } from '@/components/App'
import { actions } from '@/action'
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
import type { Command } from '@/services/userSettings'
import { linksInSelection } from '@/services/util'
import { OPEN_MODE } from '@/const'
import { ExecState } from '@/action'

type MenuItemProps = {
  menuRef: React.RefObject<Element>
  onlyIcon: boolean
  command: Command
}

export function MenuItem(props: MenuItemProps): JSX.Element {
  const elmRef = useRef(null)
  const [execState, setExecState] = useState<ExecState>(ExecState.NONE)
  const onlyIcon = props.onlyIcon
  const { openMode, openModeSecondary, iconUrl, title: _title } = props.command
  const { selectionText } = useContext(context)
  let title = _title
  let enable = true

  if (openMode === OPEN_MODE.LINK_POPUP) {
    const links = linksInSelection()
    console.debug('links', links)
    enable = links.length > 0
    title = `${links.length} links`
  }

  function handleClick(e: React.MouseEvent) {
    if (execState !== ExecState.NONE) {
      return
    }

    let mode = openMode
    if (e.ctrlKey && openModeSecondary) {
      mode = openModeSecondary
    }

    actions[mode].execute({
      selectionText,
      command: props.command,
      menuElm: props.menuRef.current,
      e,
      changeState: setExecState,
    })

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
        <ImageWithState state={execState} iconUrl={iconUrl} />
        <span className={itemTitle}>{title}</span>
      </button>
      {onlyIcon && <Tooltip positionRef={elmRef}>{title}</Tooltip>}
    </>
  )
}

type ImageProps = {
  state: ExecState
  iconUrl: string
}

function ImageWithState(props: ImageProps): JSX.Element {
  const { iconUrl, state: status } = props
  return (
    <>
      {status === ExecState.NONE && (
        <img className={itemImg} src={iconUrl} alt="icon" />
      )}
      {status === ExecState.EXECUTING && (
        <Icon
          className={`${itemImg} ${apiIconLoading} rotate`}
          name="refresh"
        />
      )}
      {status === ExecState.SUCCESS && (
        <Icon className={`${itemImg} ${apiIconSuccess}`} name="check" />
      )}
      {status === ExecState.FAIL && (
        <Icon className={`${itemImg} ${apiIconError}`} name="error" />
      )}
    </>
  )
}
