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
import { Icon } from '@/components/Icon'
import { ResultPopup } from '@/components/result/ResultPopup'
import type { Command } from '@/services/userSettings'
import { linksInSelection } from '@/services/util'
import { OPEN_MODE } from '@/const'
import { ExecState } from '@/action'

type MenuItemProps = {
  menuRef: React.RefObject<Element>
  onlyIcon: boolean
  command: Command
}

type ItemState = {
  state: ExecState
  message?: string
}

export function MenuItem(props: MenuItemProps): React.ReactNode {
  const elmRef = useRef(null)
  const [itemState, setItemState] = useState<ItemState>({
    state: ExecState.NONE,
  })
  const [result, setResult] = useState<React.ReactNode>()
  const onlyIcon = props.onlyIcon
  const { openMode, openModeSecondary, iconUrl, title } = props.command
  const { selectionText, target } = useContext(context)
  let message = itemState.message || title
  let enable = true

  if (openMode === OPEN_MODE.LINK_POPUP) {
    const links = linksInSelection()
    console.debug('links', links)
    enable = links.length > 0
    message = `${links.length} links`
  }

  const onChangeState = (state: ExecState, message?: string) => {
    setItemState({ state, message })
  }

  function handleClick(e: React.MouseEvent) {
    if (itemState.state !== ExecState.NONE) {
      return
    }

    let mode = openMode
    if (e.ctrlKey && openModeSecondary) {
      mode = openModeSecondary
    }

    actions[mode]
      .execute({
        selectionText,
        command: props.command,
        menuElm: props.menuRef.current,
        e,
        changeState: onChangeState,
        target,
      })
      .then((res) => {
        if (res) {
          setResult(res)
        }
      })

    e.stopPropagation()
  }

  return (
    <>
      <Tooltip text={message} disabled={onlyIcon}>
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
          <ImageWithState state={itemState.state} iconUrl={iconUrl} />
          <span className={itemTitle}>{message}</span>
        </button>
      </Tooltip>
      <ResultPopup
        visible={result != null}
        positionRef={elmRef}
        onClose={() => setResult(undefined)}
      >
        {result}
      </ResultPopup>
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
