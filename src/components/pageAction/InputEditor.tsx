import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { InputMenu } from '@/components/pageAction/InputPopup'
import {
  convSymbolsToReadableKeys,
  convReadableKeysToSymbols,
} from '@/services/pageAction'

type InputEditorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string | null
  onSubmit: (value: string) => void
}

export function InputEditor(props: InputEditorProps) {
  const defaultVal = convSymbolsToReadableKeys(props.value ?? '')
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)

  const handleSubmit = () => {
    props.onSubmit(convReadableKeysToSymbols(textarea?.value || ''))
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Inputアクションの編集</DialogTitle>
          <DialogDescription>
            このアクションにより入力される内容を編集してください。
          </DialogDescription>
        </DialogHeader>
        <div className="retative">
          <InputMenu
            targetElm={textarea}
            className="w-fit relative left-[100%] -translate-x-[100%] -top-1"
          />
          <Textarea
            id="input-action"
            placeholder="入力される内容"
            rows={4}
            defaultValue={defaultVal}
            ref={setTextarea}
          />
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant="secondary">やめる</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}>
            保存する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
