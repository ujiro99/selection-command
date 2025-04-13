import { useState, useRef } from 'react'
import { Copy } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/Tooltip'
import { t } from '@/services/i18n'
import { cn } from '@/lib/utils'

type CopyButtonProps = {
  srcTitle: string
  onClick: (title: string) => void
  size?: number
  className?: string
}

export const CopyButton = ({
  srcTitle,
  onClick,
  size = 16,
  className,
}: CopyButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const onCopy = (title: string) => {
    onClick(title)
  }
  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        className={cn(
          'outline-gray-200 p-2 rounded-md transition hover:bg-gray-100 hover:scale-125 group/edit-button',
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Copy
          className="stroke-gray-500 group-hover/edit-button:stroke-gray-500"
          size={size}
        />
      </button>
      <CopyDialog
        srcTitle={srcTitle}
        open={open}
        onOpenChange={setOpen}
        onCopy={onCopy}
      />
      <Tooltip
        positionElm={buttonRef.current}
        text={t('Option_copy_tooltip')}
      />
    </>
  )
}

function incrementLastNumber(str: string): string {
  const match = str.match(/(\d+)$/)
  if (match) {
    const number = match[0]
    const incrementedNumber = (parseInt(number, 10) + 1).toString()
    return str.slice(0, -number.length) + incrementedNumber
  } else {
    return str + ' 1'
  }
}

type CopyDialogProps = {
  srcTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCopy: (name: string) => void
}

export const CopyDialog = ({
  srcTitle,
  open,
  onOpenChange,
  onCopy,
}: CopyDialogProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleOpenAutoFocus = (e: Event) => {
    buttonRef.current?.focus()
    e.preventDefault()
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={handleOpenAutoFocus}>
        <DialogHeader>
          <DialogTitle>{t('Option_copy_title')}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{t('Option_copy_desc')}</DialogDescription>
        <Input
          type="text"
          ref={inputRef}
          defaultValue={incrementLastNumber(srcTitle)}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="lg">
              {t('Option_labelCancel')}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              size="lg"
              onClick={() => onCopy(inputRef.current?.value ?? '')}
              ref={buttonRef}
            >
              <Copy />
              {t('Option_copy_ok')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
