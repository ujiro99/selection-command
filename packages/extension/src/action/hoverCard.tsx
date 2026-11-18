import type { ExecuteCommandParams } from "@/types"
import { isHoverCardCommand } from "@/lib/commandGuards"
import { loadHoverCard, HoverCardError } from "@/services/hoverCard"
import { getUILanguage } from "@/services/i18n"
import { HoverCardError as HoverCardErrorView } from "@/components/hoverCard/HoverCardMessage"
import css from "@/components/hoverCard/HoverCard.module.css"

/**
 * Entry point for HOVER_CARD commands executed without hovering
 * (e.g. shortcut keys). The menu item handles hover by itself.
 * The returned node is shown in the result popup.
 */
export const HoverCard = {
  async execute({ command, selectionText }: ExecuteCommandParams) {
    if (!isHoverCardCommand(command)) return

    try {
      const content = await loadHoverCard(
        command.hoverCardOption.provider,
        selectionText,
        {
          signal: new AbortController().signal,
          ctx: {
            uiLanguage: getUILanguage(),
            pageLang: document.documentElement.lang,
          },
        },
      )
      if (content == null) return
      return <div className={css.card}>{content}</div>
    } catch (e) {
      const kind = e instanceof HoverCardError ? e.kind : "failed"
      return (
        <div className={css.card}>
          <HoverCardErrorView kind={kind} />
        </div>
      )
    }
  },
}
