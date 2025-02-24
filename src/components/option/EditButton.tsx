import React, { useRef } from 'react'
import { Pencil } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

type EditButtonProps = {
  onClick: () => void
}

export const EditButton = ({ onClick }: EditButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handleClick = (e: React.SyntheticEvent) => {
    onClick()
    e.preventDefault()
  }
  return (
    <>
      <button
        ref={buttonRef}
        className="p-2 rounded-md transition hover:bg-sky-100 hover:scale-125 group"
        onClick={handleClick}
      >
        <Pencil
          className="stroke-gray-500 group-hover:stroke-sky-500"
          size={16}
        />
      </button>
      <Tooltip positionElm={buttonRef.current} text={'編集'} />
    </>
  )
}
