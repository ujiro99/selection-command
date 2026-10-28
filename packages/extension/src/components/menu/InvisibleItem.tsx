import React, { useRef, useEffect, useMemo, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

import { ResultPopup } from "@/components/result/ResultPopup"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { useContextMenu } from "@/hooks/useContextMenu"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useCommandExecutor } from "@/hooks/useCommandExecutor"
import { useZoomCompensation } from "@/hooks/usePageZoom"
import type { SelectionCommand } from "@/types"
import { POPUP_OFFSET, ExecState } from "@/const"

import css from "./Menu.module.css"
import zc from "@/components/zoomCompensation.module.css"

type InvisibleItemProps = {
  positionElm?: Element | null
}

export function InvisibleItem(props: InvisibleItemProps): React.ReactNode {
  const { selectionText, target } = useSelectContext()
  const { action, clearAction } = useContextMenu()
  const { itemState, result, executeCommand, clearResult } =
    useCommandExecutor()
  const elmRef = useRef<HTMLDivElement>(null)
  const zoomCompensation = useZoomCompensation()

  useEffect(() => {
    clearResult()
  }, [props.positionElm])

  useEffect(() => {
    const onSelectionchange = () => {
      clearResult()
    }
    document.addEventListener("selectionchange", onSelectionchange)
    return () => {
      document.removeEventListener("selectionchange", onSelectionchange)
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
      // This item is outside the popup menu, which sets it for the menu.
      "--sc-zoom-compensation": zoomCompensation,
      position: "absolute" as const,
      top: window.scrollY + position.y,
      left: window.scrollX + position.x,
      height: 0,
      width: 0,
      pointerEvents: "none" as const,
    } as CSSProperties
  }, [position, zoomCompensation])

  if (action != null) {
    executeCommand({
      command: action.command as SelectionCommand,
      position,
      // Prefer the selection decided by the sender, which ignores the
      // selection when another app has focus.
      selectionText: action.selectionText ?? selectionText,
      target,
      selectionFromClipboard: action.selectionFromClipboard,
    })
    clearAction()
  }

  const visible = result != null

  return (
    <div style={style} ref={elmRef}>
      <IconWithState state={itemState.state} positionElm={props.positionElm} />
      <ResultPopup
        visible={visible}
        positionRef={elmRef}
        onClose={clearResult}
        className={"pointer-events-auto"}
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
        "shadow-md border border-gray-200 dark:border-border bg-white",
        zc.border,
        zc.shadowMd,
      )}
    >
      {status === ExecState.EXECUTING && (
        <RefreshCw className={`${css.itemImg} ${css.apiIconLoading} rotate`} />
      )}
      {status === ExecState.SUCCESS && (
        <Check className={`${css.itemImg} ${css.apiIconSuccess}`} />
      )}
      {status === ExecState.FAIL && (
        <AlertCircle className={`${css.itemImg} ${css.apiIconError}`} />
      )}
    </div>
  )
}
