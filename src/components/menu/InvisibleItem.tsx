import React, { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'

import { ResultPopup } from '@/components/result/ResultPopup'
import { Icon } from '@/components/Icon'
import { useContextMenu } from '@/hooks/useContextMenu'
import { useSelectContext } from '@/hooks/useSelectContext'
import type { SelectionCommand } from '@/types'
import { actions, ExecState } from '@/action'
import { POPUP_OFFSET } from '@/const'

import css from './Menu.module.css'

type InvisibleItemProps = {
  positionElm?: Element | null
}

type ItemState = {
  state: ExecState
  message?: string
}

export function InvisibleItem(props: InvisibleItemProps): React.ReactNode {
  const { selectionText, target } = useSelectContext()
  const { command, setCommand } = useContextMenu()
  const [itemState, setItemState] = useState<ItemState>({
    state: ExecState.NONE,
  })
  const [result, setResult] = useState<React.ReactNode>()
  const elmRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setResult(undefined)
  }, [props.positionElm])

  useEffect(() => {
    const onSelectionchange = () => {
      setResult(undefined)
    }
    document.addEventListener('selectionchange', onSelectionchange)
    return () => {
      document.removeEventListener('selectionchange', onSelectionchange)
    }
  }, [])

  const position = useMemo(() => {
    let p = { x: 0, y: 0 }
    if (props.positionElm) {
      const rect = props.positionElm.getBoundingClientRect()
      p = { x: rect.left + POPUP_OFFSET, y: rect.top }
    } else {
      // Use center of screen as position
      p = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }
    }
    return p
  }, [props.positionElm])

  const style = useMemo(() => {
    return {
      position: 'absolute' as const,
      top: window.scrollY + position.y,
      left: window.scrollX + position.x,
      height: 0,
      width: 0,
      pointerEvents: 'none' as const,
    }
  }, [position])

  const onChangeState = (state: ExecState, message?: string) => {
    setItemState({ state, message })
  }

  function execute(command: SelectionCommand) {
    if (itemState.state !== ExecState.NONE) {
      return
    }

    actions[command.openMode]
      .execute({
        selectionText,
        command: command,
        position,
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
    execute(command as SelectionCommand)
  }

  const visible = result != null

  return (
    <div style={style} ref={elmRef}>
      <IconWithState state={itemState.state} positionElm={props.positionElm} />
      <ResultPopup
        visible={visible}
        positionRef={elmRef}
        onClose={() => setResult(undefined)}
        className={'pointer-events-auto'}
      >
        {result}
      </ResultPopup>
    </div>
  )
}

type ImageProps = {
  state: ExecState
  positionElm?: Element | null
}

function IconWithState(props: ImageProps): JSX.Element {
  const { state: status } = props

  if (status == ExecState.NONE) return <></>

  return (
    <div
      className={cn(
        css.iconWithState,
        'shadow-md border border-gray-200 bg-white w-5 h-5',
      )}
    >
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
