import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

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

type RemoveButtonProps = {
  onRemove: () => void
  title: string
  iconUrl?: string
}

export const RemoveButton = ({
  title,
  iconUrl,
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
      <Tooltip positionElm={buttonRef.current} text={'削除'} />
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>削除しますか？</DialogTitle>
        </DialogHeader>
        <DialogDescription className="flex items-center justify-center overflow-hidden">
          {iconUrl != null && (
            <img
              src={iconUrl}
              alt={title}
              className="inline-block w-6 h-6 mr-2"
            />
          )}
          <span className="text-base truncate">{title}</span>
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" size="lg">
              やめる
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
              削除する
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
