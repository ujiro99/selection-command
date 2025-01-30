import { useRef } from 'react'
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

type InputEditorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSubmit: (value: string) => void
}

export function InputEditor(props: InputEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    props.onSubmit(textareaRef.current?.value || '')
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
        <div>
          <Textarea
            id="input-action"
            placeholder="入力される内容"
            rows={4}
            defaultValue={props.value}
            ref={textareaRef}
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
