import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import { t } from '@/services/i18n'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MenuImage } from '@/components/menu/MenuImage'

type RemoveButtonProps = {
  onRemove: () => void
  title: string
  iconUrl?: string
  iconSvg?: string
}

export const RemoveButton = ({
  title,
  iconUrl,
  iconSvg,
  onRemove,
}: RemoveButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog>
      <DialogTrigger
        ref={buttonRef}
        className="p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group"
        asChild
      >
        <button>
          <Trash2
            className="stroke-gray-500 group-hover:stroke-red-500"
            size={16}
          />
        </button>
      </DialogTrigger>
      <Tooltip
        positionElm={buttonRef.current}
        text={t('Option_remove_tooltip')}
      />
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>{t('Option_remove_title')}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="flex items-center justify-center overflow-hidden">
          {(iconUrl != null || iconSvg != null) && (
            <MenuImage
              className="inline-block w-6 h-6 mr-2"
              src={iconUrl}
              svg={iconSvg}
              alt={title}
            />
          )}
          <span className="text-base truncate">{title}</span>
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
