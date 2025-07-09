import { useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogPortal,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { InputMenu } from "@/components/pageAction/InputPopup"
import {
  convSymbolsToReadableKeys,
  convReadableKeysToSymbols,
} from "@/services/pageAction"
import { t } from "@/services/i18n"

type InputEditorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string | null
  onSubmit: (value: string) => void
  portal?: boolean
}

export function InputEditor(props: InputEditorProps) {
  const defaultVal = convSymbolsToReadableKeys(props.value ?? "")
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)

  const handleSubmit = () => {
    props.onSubmit(convReadableKeysToSymbols(textarea?.value || ""))
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPortal portal={props.portal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              <span className="mr-2">✏️</span>
              {t("PageAction_InputEditor_title")}
            </DialogTitle>
            <DialogDescription>
              {t("PageAction_InputEditor_description")}
            </DialogDescription>
          </DialogHeader>
          <div className="retative">
            <InputMenu
              targetElm={textarea}
              className="w-fit relative left-[100%] -translate-x-[100%] -top-1"
            />
            <Textarea
              id="input-action"
              placeholder={t("PageAction_InputEditor_placeholder")}
              rows={4}
              defaultValue={defaultVal}
              ref={setTextarea}
              className="text-sm"
            />
          </div>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary">
                {t("PageAction_InputEditor_cancel")}
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmit}>
              <Save size={16} className="mr-0.5" />
              {t("PageAction_InputEditor_save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
