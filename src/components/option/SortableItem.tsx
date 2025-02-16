import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

type SrotabelItemProps = {
  id: string
  children: React.ReactNode
  className?: string
}

export function SortableItem(props: SrotabelItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn('pl-1 flex items-center cursor-auto', props.className)}
      {...attributes}
    >
      <div
        className={cn(
          'p-1 py-2 mr-1 hover:bg-gray-100 cursor-grab rounded-md transition duration-200',
          isDragging && 'cursor-grabbing',
        )}
        ref={setActivatorNodeRef}
        {...listeners}
      >
        <GripVertical size={18} className="stroke-gray-400" />
      </div>
      {props.children}
    </li>
  )
}
