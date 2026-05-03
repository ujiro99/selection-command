import { useState, useRef } from "react"
import { Share } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { cn } from "@/lib/utils"
import { t } from "@/services/i18n"
import { shareCommandToHub } from "@/services/hubShare"
import { NEW_HUB_SHAREABLE_OPEN_MODES, COMMAND_SOURCE_TYPE } from "@/const"
import type { SelectionCommand } from "@/types"

const VALID_SOURCE_TYPES = new Set([
  COMMAND_SOURCE_TYPE.SELF_CREATED,
  COMMAND_SOURCE_TYPE.SELF_UPDATED,
  COMMAND_SOURCE_TYPE.UNKNOWN,
])

type Props = {
  command: SelectionCommand
}

export const ShareButton = ({ command }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle")

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = shareCommandToHub(command)
    setStatus(ok ? "sent" : "error")
    setTimeout(() => setStatus("idle"), 2000)
  }

  if (
    !NEW_HUB_SHAREABLE_OPEN_MODES.has(command.openMode) ||
    !VALID_SOURCE_TYPES.has(command.sourceType ?? COMMAND_SOURCE_TYPE.UNKNOWN)
  ) {
    return null
  }

  return (
    <>
      <button
        type="button"
        disabled={status !== "idle"}
        className={cn(
          "outline-gray-200 p-2 rounded-md transition hover:bg-green-100 hover:scale-125 group/share-btn",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        )}
        onClick={handleClick}
        ref={buttonRef}
      >
        <Share
          className={cn(
            "stroke-gray-500 group-hover/share-btn:stroke-green-600",
            status === "error" && "stroke-red-500",
          )}
          size={16}
        />
      </button>
      <Tooltip
        positionElm={buttonRef.current}
        text={t("Option_shareButton_tooltip")}
      />
    </>
  )
}
