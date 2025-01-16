import React, { useState, useRef, useContext } from 'react'
import clsx from 'clsx'
import { popupContext } from '@/components/Popup'
import { actions } from '@/action'
import { Tooltip } from '../Tooltip'
import { Icon } from '@/components/Icon'
import { ResultPopup } from '@/components/result/ResultPopup'
import { linksInSelection } from '@/services/dom'
import { useSelectContext } from '@/hooks/useSelectContext'
import { sendEvent } from '@/services/analytics'
import { OPEN_MODE } from '@/const'
import { ExecState } from '@/action'
import type { Command } from '@/types'

import css from './Menu.module.css'

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
  const buttonRef = useRef(null)
  const [itemState, setItemState] = useState<ItemState>({
    state: ExecState.NONE,
  })
  const [result, setResult] = useState<React.ReactNode>()
  const onlyIcon = props.onlyIcon
  const { openMode, openModeSecondary, iconUrl, title } = props.command
  const { selectionText, target } = useSelectContext()
  const { isPreview, inTransition } = useContext(popupContext)
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
    if (isPreview) {
      return
    }
    if (itemState.state !== ExecState.NONE) {
      return
    }
    if (props.menuRef.current == null) {
      return
    }

    let mode = openMode as OPEN_MODE
    const useSecondary = e.metaKey || e.ctrlKey
    if (useSecondary && openModeSecondary) {
      mode = openModeSecondary
    }

    const rect = props.menuRef.current.getBoundingClientRect()

    actions[mode]
      .execute({
        selectionText,
        command: props.command,
        position: { x: rect.right + 10, y: rect.top },
        useSecondary,
        changeState: onChangeState,
        target,
      })
      .then((res) => {
        if (res) {
          setResult(res)
        }
      })

    sendEvent('selection_command', { id: mode })
    e.stopPropagation()
  }

  return (
    <>
      <button
        type="button"
        className={clsx(
          css.item,
          css.button,
          {
            [css.itemHorizontal]: onlyIcon,
            ['hover:bg-accent']: !inTransition,
          },
          'rounded-sm ',
        )}
        ref={buttonRef}
        onClick={handleClick}
        disabled={!enable}
      >
        <ImageWithState state={itemState.state} iconUrl={iconUrl} />
        {!onlyIcon && <span className={css.itemTitle}>{title}</span>}
      </button>
      <Tooltip
        text={message}
        positionElm={buttonRef.current}
        disabled={!onlyIcon || inTransition}
      />
      <ResultPopup
        visible={result != null}
        positionRef={buttonRef}
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
        <img className={css.itemImg} src={iconUrl} alt="icon" />
      )}
      {status === ExecState.EXECUTING && (
        <Icon
          className={`${css.itemImg} ${css.apiIconLoading} rotate`}
          name="refresh"
        />
      )}
      {status === ExecState.SUCCESS && (
        <Icon className={`${css.itemImg} ${css.apiIconSuccess}`} name="check" />
      )}
      {status === ExecState.FAIL && (
        <Icon className={`${css.itemImg} ${css.apiIconError}`} name="error" />
      )}
    </>
  )
}
