import { useState, useEffect } from "react"
import clsx from "clsx"
import { toast, Toaster } from "sonner"
import { Ipc, BgCommand } from "@/services/ipc"
import { useSection } from "@/hooks/useSettings"
import { useDetectUrlChanged } from "@/hooks/useDetectUrlChanged"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { sendEvent, ANALYTICS_EVENTS } from "@/services/analytics"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
} from "@/components/ui/popover"
import { SCREEN, HUB_URL } from "@/const"
import { t } from "@/services/i18n"

const TooltipDuration = 2000

export const DownloadButton = (): JSX.Element => {
  const [position, setPosition] = useState<Element | null>(null)
  const { data: commands } = useSection(CACHE_SECTIONS.COMMANDS)
  const { addUrlChangeListener, removeUrlChangeListener } =
    useDetectUrlChanged()
  const [shouldRender, setShouldRender] = useState(false)
  const open = position != null

  const setButtonClickListener = () => {
    document.querySelectorAll("button[data-command]").forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return
      const command = button.dataset.command
      const id = button.dataset.id
      if (command == null) return
      button.dataset.clickable = "true"

      // Deprecated:
      // We will remove this in the future.
      // Please use postMessage to communicate with the content script.
      button.addEventListener("click", () => {
        Ipc.send(BgCommand.addCommand, { command }).then((res) => {
          if (res) {
            sendEvent(
              ANALYTICS_EVENTS.COMMAND_HUB_ADD,
              { id },
              SCREEN.COMMAND_HUB,
            )
            setPosition(button.parentElement)
          }
        })
      })
    })
  }

  const updateButtonVisibility = () => {
    const ids = commands?.map((c) => c.id) ?? []
    ids.forEach((id) => {
      // hide installed buttons
      const installed = document.querySelector(
        `button[data-id="${id}"]`,
      ) as HTMLElement
      if (installed) installed.style.display = "none"
      // show installed label
      const p = document.querySelector(`p[data-id="${id}"]`) as HTMLElement
      if (p) p.style.display = "block"
    })
  }

  const updateCount = () => {
    document.querySelectorAll("span[data-id]").forEach((span) => {
      if (!(span instanceof HTMLElement)) return
      const count = Number(span.dataset.downloadCount)
      if (count == null || isNaN(count)) return
      let reviced = 0
      const cmd = commands?.find((c) => c.id === span.dataset.id)
      if (cmd != null) {
        // There is a command.
        reviced++
      }
      span.textContent = (count + reviced).toLocaleString()
    })
  }

  useEffect(() => {
    setButtonClickListener()
    updateButtonVisibility()
    addUrlChangeListener(setButtonClickListener)
    addUrlChangeListener(updateButtonVisibility)
    return () => {
      removeUrlChangeListener(setButtonClickListener)
    }
  }, [])

  useEffect(() => {
    updateButtonVisibility()
    updateCount()
    addUrlChangeListener(updateButtonVisibility)
    addUrlChangeListener(updateCount)
    return () => {
      removeUrlChangeListener(updateButtonVisibility)
      removeUrlChangeListener(updateCount)
    }
  }, [commands])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => setPosition(null), TooltipDuration)
    return () => {
      clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (open) {
      timer = setTimeout(() => {
        setShouldRender(true)
      }, 100)
    } else {
      setShouldRender(false)
    }
    return () => clearTimeout(timer)
  }, [open])

  /**
   * External postMessage API for adding/deleting commands from the Hub.
   *
   * This content script listens for messages from the Hub page (origin must match HUB_URL).
   * The message object must have the following shape:
   *
   * --- AddCommand ---
   * {
   *   action: "AddCommand",
   *   command: string  // JSON-stringified command object (see below)
   * }
   *
   * The `command` field is a JSON string representing a SearchCommand, an AiPromptCommand, or a PageActionCommand.
   *
   * SearchCommand (openMode is one of "popup" | "tab" | "window" | "backgroundTab" | "sidePanel"):
   * {
   *   id: string,                // Unique command identifier
   *   title: string,             // Display name of the command
   *   searchUrl: string,         // Search URL template (%s is replaced with selected text)
   *   iconUrl: string,           // URL of the command icon
   *   openMode: string,          // How to open the result: "popup" | "tab" | "window" | "backgroundTab" | "sidePanel"
   *   openModeSecondary?: string, // Secondary open mode (optional)
   *   spaceEncoding?: string,    // Space encoding in URL: "plus" | "percent" (optional)
   *   sourceType?: string,       // Origin of the command: "default" | "selfCreated" | "hubCommunity" | "unknown" (optional)
   *   sourceId?: string          // Identifier of the source (optional)
   * }
   *
   * AiPromptCommand (openMode is "aiPrompt"):
   * {
   *   id: string,                // Unique command identifier
   *   title: string,             // Display name of the command
   *   iconUrl: string,           // URL of the command icon
   *   openMode: "aiPrompt",      // Must be "aiPrompt" for AI prompt commands
   *   aiPromptOption: {
   *     serviceId: string,       // ID of the AI service to use (see hub/public/data/ai-services.json)
   *     prompt: string,          // Prompt text sent to the AI service (supports variable placeholders)
   *     openMode: string         // How to open the AI service result: "popup" | "tab" | "window" | etc.
   *   },
   *   sourceType?: string,       // Origin of the command: "default" | "selfCreated" | "hubCommunity" | "unknown" (optional)
   *   sourceId?: string          // Identifier of the source (optional)
   * }
   *
   * PageActionCommand (openMode is "pageAction"):
   * {
   *   id: string,                // Unique command identifier
   *   title: string,             // Display name of the command
   *   iconUrl: string,           // URL of the command icon
   *   openMode: "pageAction",    // Must be "pageAction" for page action commands
   *   pageActionOption: {
   *     startUrl: string,        // URL to open when executing the page action
   *     pageUrl?: string,        // URL pattern for command enablement (currentTab mode only, optional)
   *     openMode: string,        // How to open the page: "none" | "popup" | "tab" | "backgroundTab" | "window" | "currentTab"
   *     steps: Array<PageActionStep>, // Sequence of automation steps to execute
   *     userVariables?: Array<{ name: string, value: string }> // User-defined variables (optional)
   *   },
   *   sourceType?: string,       // Origin of the command: "default" | "selfCreated" | "hubCommunity" | "unknown" (optional)
   *   sourceId?: string          // Identifier of the source (optional)
   * }
   *
   * --- DeleteCommand ---
   * {
   *   action: "DeleteCommand",
   *   id: string  // ID of the command to remove
   * }
   */
  useEffect(() => {
    const hubOrigin = new URL(HUB_URL).origin
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== hubOrigin) return
      const { action, command, id } = event.data ?? {}
      if (action === "AddCommand") {
        if (typeof command !== "string") return
        Ipc.send(BgCommand.addCommand, { command })
          .then((res) => {
            if (res) {
              toast.success(t("commandHub_add_success"))
            } else {
              toast.error(t("commandHub_add_error"))
            }
          })
          .catch(() => {
            toast.error(t("commandHub_add_error"))
          })
      } else if (action === "DeleteCommand") {
        if (typeof id !== "string") return
        Ipc.send(BgCommand.removeCommand, { id })
          .then((res) => {
            if (res) {
              toast.success(t("commandHub_delete_success"))
            } else {
              toast.error(t("commandHub_delete_error"))
            }
          })
          .catch(() => {
            toast.error(t("commandHub_delete_error"))
          })
      }
    }
    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  return (
    <>
      <Toaster position="bottom-center" />
      <Popover open={open}>
        <PopoverAnchor virtualRef={{ current: position }} />
        {shouldRender && (
          <PopoverContent
            className={clsx(
              "bg-stone-800 min-w-4 px-2 py-1.5 text-xs text-white shadow-md",
            )}
            side="top"
            arrowPadding={-1}
          >
            Command added!
            <PopoverArrow className="fill-gray-800" height={6} />
          </PopoverContent>
        )}
      </Popover>
    </>
  )
}
