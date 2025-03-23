import { Trash2 } from 'lucide-react'
import { t } from '@/services/i18n'

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

type RemoveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemove: () => void
  children: React.ReactNode
}

export const RemoveDialog = ({
  open,
  onOpenChange,
  onRemove,
  children,
}: RemoveDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>{t('Option_remove_title')}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="flex items-center justify-center overflow-hidden">
          {children}
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="lg">
              {t('Option_labelCancel')}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={() => onRemove()}
            >
              <Trash2 />
              {t('Option_remove_ok')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
