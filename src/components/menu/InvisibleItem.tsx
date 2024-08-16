import React, { useState, useEffect, useContext } from 'react'
import { context } from '@/components/App'
import { actions } from '@/action'
import { ResultPopup } from '@/components/result/ResultPopup'
import type { Command } from '@/services/userSettings'
import { ExecState } from '@/action'
import { useContextMenu } from '@/hooks/useContextMenu'

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
    actions[command.openMode]
      .execute({
        selectionText,
        command: command,
        menuElm: props.positionElm,
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
    <div>
      <ResultPopup
        visible={visible}
        positionElm={props.positionElm}
        onClose={() => setResult(undefined)}
      >
        {result}
      </ResultPopup>
    </div>
  )
}
