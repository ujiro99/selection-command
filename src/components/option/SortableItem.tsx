import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Command, CommandFolder } from "@/types"

type SrotabelItemProps = {
  id: string
  index: number
  children: React.ReactNode
  level: number
  className?: string
  droppable?: boolean
  content: Command | CommandFolder
  folders?: CommandFolder[]
}

export function SortableItem(props: SrotabelItemProps) {
  const isDroppable = props.droppable ?? true
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    activeIndex,
    isDragging,
  } = useSortable({
    id: props.id,
    data: {
      content: props.content,
      folders: props.folders,
    },
    transition: {
      duration: 150,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${props.level * 32}px`,
  }

  return (
    <li
      ref={isDroppable ? setNodeRef : null}
      style={style}
      className={cn(
        "pl-1 flex items-center cursor-auto",
        props.index === 0 ? "" : "border-t",
        props.index === activeIndex
          ? "border-y bg-gray-100/80 shadow-lg relative z-10"
          : "",
        props.className,
      )}
      {...attributes}
    >
      <div
        className={cn(
          "p-1 py-2 mr-1 hover:bg-gray-100 cursor-grab rounded-md transition duration-200",
          isDragging && "cursor-grabbing",
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
