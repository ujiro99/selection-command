import React, { useRef } from 'react'
import { Pencil } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import { t } from '@/services/i18n'
import { cn } from '@/lib/utils'

type EditButtonProps = {
  onClick: () => void
  size?: number
  className?: string
}

export const EditButton = ({
  onClick,
  size = 16,
  className,
}: EditButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleClick = (e: React.SyntheticEvent) => {
    onClick()
    e.preventDefault()
  }
  return (
    <>
      <button
        ref={buttonRef}
        className={cn(
          'outline-gray-200 p-2 rounded-md transition hover:bg-sky-100 hover:scale-125 group/edit-button',
          className,
        )}
        onClick={handleClick}
      >
        <Pencil
          className="stroke-gray-500 group-hover/edit-button:stroke-sky-500"
          size={size}
        />
      </button>
      <Tooltip
        positionElm={buttonRef.current}
        text={t('Option_edit_tooltip')}
      />
    </>
  )
}
