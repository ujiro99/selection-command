import React, { useState, useRef, useEffect, useContext } from 'react'

import { context } from '@/components/App'
import { ResultPopup } from '@/components/result/ResultPopup'
import { Icon } from '@/components/Icon'
import { useContextMenu } from '@/hooks/useContextMenu'
import type { Command } from '@/types'
import { actions, ExecState } from '@/action'
import { OPEN_MODE, POPUP_OFFSET } from '@/const'

import css from './Menu.module.css'

type InvisibleItemProps = {
  positionElm: Element | null
}

type ItemState = {
  state: ExecState
  message?: string
}

export function InvisibleItem(props: InvisibleItemProps): React.ReactNode {
  const { selectionText, target } = useContext(context)
  const { command, setCommand } = useContextMenu()
  const [itemState, setItemState] = useState<ItemState>({
    state: ExecState.NONE,
  })
  const [result, setResult] = useState<React.ReactNode>()
  const elmRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setResult(undefined)
  }, [props.positionElm])

  const onChangeState = (state: ExecState, message?: string) => {
    setItemState({ state, message })
  }

  function execute(command: Command) {
    if (itemState.state !== ExecState.NONE) {
      return
    }
    if (props.positionElm == null) {
      return
    }
    const rect = props.positionElm.getBoundingClientRect()
    actions[command.openMode as OPEN_MODE]
      .execute({
        selectionText,
        command: command,
        position: { x: rect.left + POPUP_OFFSET, y: rect.top },
        useSecondary: false,
        changeState: onChangeState,
        target,
      })
      .then((res) => {
        if (res) {
          setResult(res)
        }
      })
    setCommand(null)
  }

  if (command != null) {
    execute(command)
  }

  const visible = result != null && props.positionElm != null

  return (
    <div ref={elmRef}>
      <IconWithState state={itemState.state} positionElm={props.positionElm} />
      <ResultPopup
        visible={visible}
        positionRef={elmRef}
        onClose={() => setResult(undefined)}
      >
        {result}
      </ResultPopup>
    </div>
  )
}

type ImageProps = {
  state: ExecState
  positionElm: Element | null
}

function IconWithState(props: ImageProps): JSX.Element {
  const { state: status } = props

  if (status == ExecState.NONE) return <></>

  return (
    <div className={css.iconWithState}>
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
    </div>
  )
}
