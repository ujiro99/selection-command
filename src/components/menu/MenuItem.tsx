import React, { useRef, useContext } from 'react'
import clsx from 'clsx'
import { popupContext } from '@/components/Popup'
import { Tooltip } from '../Tooltip'
import { Icon } from '@/components/Icon'
import { ResultPopup } from '@/components/result/ResultPopup'
import { linksInSelection } from '@/services/dom'
import { useSelectContext } from '@/hooks/useSelectContext'
import { useCommandExecutor } from '@/hooks/useCommandExecutor'
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

export function MenuItem(props: MenuItemProps): React.ReactNode {
  const buttonRef = useRef(null)
  const { itemState, result, executeCommand, clearResult } =
    useCommandExecutor()
  const onlyIcon = props.onlyIcon
  const { openMode, iconUrl, title } = props.command
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

  function handleClick(e: React.MouseEvent) {
    if (isPreview) {
      return
    }
    if (props.menuRef.current == null) {
      return
    }

    const rect = props.menuRef.current.getBoundingClientRect()
    const useSecondary = e.metaKey || e.ctrlKey

    executeCommand({
      command: props.command,
      position: { x: rect.right + 10, y: rect.top },
      selectionText,
      target,
      useSecondary,
    })

    sendEvent('selection_command', { id: openMode })
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
        onClose={clearResult}
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
