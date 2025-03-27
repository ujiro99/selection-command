import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
import { Point } from '@/types'

import css from './PageActionRecorder.module.css'

type Props = {
  id: string
  children: React.ReactNode
  position?: Point
  className?: string
}

export function Draggable(props: Props) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: props.id,
    })

  let pos = {}
  if (props.position) {
    pos = {
      left: props.position.x,
      top: props.position.y,
    }
  } else {
    pos = {
      right: 10,
      bottom: 10,
    }
  }

  const diffX = transform?.x ?? 0,
    diffY = transform?.y ?? 0

  const style = {
    position: 'absolute',
    transform: `translate3d(${diffX}px, ${diffY}px, 0)`,
    transition: 'box-shadow 0.1s ease',
    ...pos,
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative', isDragging && 'shadow-xl', props.className)}
    >
      {props.children}
      <button
        className={cn(
          css.dragHandle,
          'pointer-events-auto absolute p-1 top-[50%] translate-x-[2px] translate-y-[-50%]',
          'rounded-md transition hover:bg-white/50',
        )}
        {...listeners}
        {...attributes}
      >
        <GripVertical size={18} className="stroke-gray-400" />
      </button>
    </div>
  )
}
