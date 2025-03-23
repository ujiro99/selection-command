import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import { MenuImage } from '@/components/menu/MenuImage'
import { RemoveDialog } from '@/components/option/RemoveDialog'
import { cn } from '@/lib/utils'
import { t } from '@/services/i18n'

type RemoveButtonProps = {
  onRemove: () => void
  title: string
  iconUrl?: string
  iconSvg?: string
  size?: number
  className?: string
}

export const RemoveButton = ({
  title,
  iconUrl,
  iconSvg,
  onRemove,
  size = 16,
  className,
}: RemoveButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={cn(
          'p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group/remove-button',
          className,
        )}
        onClick={() => setOpen(true)}
        ref={buttonRef}
      >
        <Trash2
          className="stroke-gray-500 group-hover/remove-button:stroke-red-500"
          size={size}
        />
      </button>
      <RemoveDialog open={open} onOpenChange={setOpen} onRemove={onRemove}>
        <>
          {(iconUrl != null || iconSvg != null) && (
            <MenuImage
              className="inline-block w-6 h-6 mr-2"
              src={iconUrl}
              svg={iconSvg}
              alt={title}
            />
          )}
          <span className="text-base truncate">{title}</span>
        </>
      </RemoveDialog>
      <Tooltip
        positionElm={buttonRef.current}
        text={t('Option_remove_tooltip')}
      />
    </>
  )
}
