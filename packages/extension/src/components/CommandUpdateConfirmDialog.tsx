import { useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Ipc, TabCommand } from "@/services/ipc"
import type { ConfirmCommandUpdateProps } from "@/services/ipc"
import { t } from "@/services/i18n"

// Named to avoid shadowing the global Fetch API `Response`.
type ConfirmResponse = (confirmed: boolean) => void

/**
 * Confirms overwriting a locally edited command with the latest content from
 * the Hub. Opened by the service worker while handling UpdateCommand, and
 * replies true (overwrite) or false (cancel).
 */
export function CommandUpdateConfirmDialog(): JSX.Element {
  const [request, setRequest] = useState<ConfirmCommandUpdateProps | null>(null)
  const responseRef = useRef<ConfirmResponse | null>(null)

  const reply = (confirmed: boolean) => {
    responseRef.current?.(confirmed)
    responseRef.current = null
    setRequest(null)
  }

  useEffect(() => {
    const handleConfirm = (
      param: ConfirmCommandUpdateProps,
      _sender: chrome.runtime.MessageSender,
      response: ConfirmResponse,
    ) => {
      // A newer request replaces an unanswered one.
      responseRef.current?.(false)
      responseRef.current = response
      setRequest(param)
      // Respond asynchronously after the user chooses.
      return true
    }
    Ipc.addListener<ConfirmCommandUpdateProps>(
      TabCommand.confirmCommandUpdate,
      handleConfirm,
    )
    return () => {
      Ipc.removeListener(TabCommand.confirmCommandUpdate)
      // Answer a pending request so the service worker does not wait on it.
      responseRef.current?.(false)
      responseRef.current = null
    }
  }, [])

  return (
    <Dialog
      open={request != null}
      onOpenChange={(open) => {
        if (!open) reply(false)
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            <RefreshCw size={18} className="stroke-sky-500" />
            {t("commandUpdate_confirm_title")}
          </DialogTitle>
          <DialogDescription className="text-sm whitespace-pre-line">
            {t("commandUpdate_confirm_message", [request?.title ?? ""])}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button variant="secondary" onClick={() => reply(false)}>
            {t("commandUpdate_confirm_cancel")}
          </Button>
          <Button onClick={() => reply(true)}>
            {t("commandUpdate_confirm_overwrite")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
