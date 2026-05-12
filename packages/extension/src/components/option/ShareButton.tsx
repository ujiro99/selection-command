import { useState, useRef } from "react"
import { Share } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"
import { cn, isUUIDv7, generateId } from "@/lib/utils"
import { t } from "@/services/i18n"
import { shareCommandToHub } from "@/services/hubShare"
import {
  NEW_HUB_SHAREABLE_OPEN_MODES,
  COMMAND_SOURCE_TYPE,
  NEW_HUB_URL,
} from "@/const"
import { getHubLocale } from "@/services/hubShare"
import type { SelectionCommand } from "@/types"

const VALID_SOURCE_TYPES = new Set([
  COMMAND_SOURCE_TYPE.SELF_CREATED,
  COMMAND_SOURCE_TYPE.SELF_UPDATED,
  COMMAND_SOURCE_TYPE.UNKNOWN,
])

type Props = {
  command: SelectionCommand
  onCommandIdChange?: (newId: string) => void
  isShared?: boolean
}

export const ShareButton = ({
  command,
  onCommandIdChange,
  isShared,
}: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle")

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isShared) {
      // Open the hub dashboard page for the shared command
      const locale = getHubLocale()
      const url = `${NEW_HUB_URL}/${locale}/dashboard/commands?id=${encodeURIComponent(command.id)}`
      chrome.tabs.create({ url })
      return
    }

    let commandToShare = command
    if (!isUUIDv7(command.id)) {
      const newId = generateId()
      commandToShare = { ...command, id: newId }
      onCommandIdChange?.(newId)
    }

    const ok = shareCommandToHub(commandToShare)
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
          isShared && "bg-green-50",
        )}
        onClick={handleClick}
        ref={buttonRef}
      >
        <Share
          className={cn(
            "stroke-gray-500 group-hover/share-btn:stroke-green-600",
            isShared && "stroke-green-600",
            status === "error" && "stroke-red-500",
          )}
          size={16}
        />
      </button>
      <Tooltip
        positionElm={buttonRef.current}
        text={
          isShared
            ? t("Option_shareButton_shared_tooltip")
            : t("Option_shareButton_tooltip")
        }
      />
    </>
  )
}
