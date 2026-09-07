import React, { useRef } from "react"
import clsx from "clsx"
import { usePopupContext } from "@/hooks/usePopupContext"
import { Tooltip } from "../Tooltip"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { ResultPopup } from "@/components/result/ResultPopup"
import { useSelectContext } from "@/hooks/useSelectContext"
import { useCommandExecutor } from "@/hooks/useCommandExecutor"
import { getCommandEnabled } from "@/lib/commandEnabled"
import { PopupOption } from "@/services/option/defaultSettings"
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
  const { isPreview, inTransition, inOnboarding } = usePopupContext()
  const { selectionText, target } = useSelectContext()
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
    let position = { x: rect.right + 10, y: rect.top }

    // During onboarding, align to the right edge so the on-screen explanation stays visible.
    if (inOnboarding) {
      const innerWidth = window.innerWidth
      const x1 = innerWidth / 2 + 620 / 2 //  width of the explanation box
      const screenWidth = window.screen.width
      const x2 = screenWidth - PopupOption.width - 20
      position = { x: Math.min(x1, x2), y: rect.top }
    }

    const useSecondary = e.metaKey || e.ctrlKey

    executeCommand({
      command: props.command,
      position,
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
          "rounded-sm",
        )}
        role="menuitem"
        aria-label={title}
        data-command-id={props.command.id}
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
        disabled={!onlyIcon && enabled}
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
        <img className={css.itemImg} src={iconUrl} alt="" aria-hidden="true" />
      )}
      {status === ExecState.EXECUTING && (
        <RefreshCw className={`${css.itemImg} ${css.apiIconLoading} rotate`} />
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
