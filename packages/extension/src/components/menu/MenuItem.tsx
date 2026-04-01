import React, { useRef, useContext } from "react"
import clsx from "clsx"
import { popupContext } from "@/components/Popup"
import { Tooltip } from "../Tooltip"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { ResultPopup } from "@/components/result/ResultPopup"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useCommandExecutor } from "@/hooks/useCommandExecutor"
import { getCommandEnabled } from "@/lib/commandEnabled"
import { ExecState } from "@/const"
import type { Command } from "@/types"

import css from "./Menu.module.css"

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
  const { iconUrl, title } = props.command
  const { selectionText, target } = useSelectContext()
  const { isPreview, inTransition } = useContext(popupContext)
  const { enabled, message: defaultMessage } = getCommandEnabled(props.command)
  const message = itemState.message || defaultMessage

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
            ["hover:bg-accent"]: !inTransition,
          },
          "rounded-sm ",
        )}
        ref={buttonRef}
        onClick={handleClick}
        disabled={!enabled}
      >
        <ImageWithState state={itemState.state} iconUrl={iconUrl} />
        {!onlyIcon && <span className={css.itemTitle}>{title}</span>}
      </button>
      <Tooltip
        text={message}
        positionElm={buttonRef.current}
        disabled={inTransition || (!onlyIcon && enabled)}
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
        <RefreshCw
          className={`${css.itemImg} ${css.apiIconLoading} rotate`}
        />
      )}
      {status === ExecState.SUCCESS && (
        <Check className={`${css.itemImg} ${css.apiIconSuccess}`} />
      )}
      {status === ExecState.FAIL && (
        <AlertCircle className={`${css.itemImg} ${css.apiIconError}`} />
      )}
    </>
  )
}
