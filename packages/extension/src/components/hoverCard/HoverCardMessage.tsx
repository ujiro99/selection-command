import { cn } from "@/lib/utils"
import { t } from "@/services/i18n"
import type { HoverCardErrorKind } from "@/services/hoverCard"
import css from "./HoverCard.module.css"

const ERROR_KEYS: Record<HoverCardErrorKind, string> = {
  needsActivation: "HoverCard_needsActivation",
  unavailable: "HoverCard_unavailable",
  unsupported: "HoverCard_unsupported",
  notApplicable: "HoverCard_notApplicable",
  failed: "HoverCard_failed",
}

export function HoverCardError({ kind }: { kind: HoverCardErrorKind }) {
  return (
    <p
      className={cn(css.message, kind === "needsActivation" && css.actionable)}
    >
      {t(ERROR_KEYS[kind])}
    </p>
  )
}

export function HoverCardLoading({ progress }: { progress?: number }) {
  // Progress is only reported while the model is being downloaded.
  const text =
    progress != null && progress < 1
      ? t("HoverCard_downloading", [String(Math.round(progress * 100))])
      : t("HoverCard_loading")
  return <p className={css.message}>{text}</p>
}
