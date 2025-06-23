import React from 'react'
import { SortableItem } from '@/components/option/SortableItem'
import { EditButton } from '@/components/option/EditButton'
import { CopyButton } from '@/components/option/CopyButton'
import { RemoveButton } from '@/components/option/RemoveButton'
import { MenuImage } from '@/components/menu/MenuImage'
import type { FlattenNode } from '@/services/commandTree'
import type { CommandFolder } from '@/types'
import {
  isCommand,
  isFolder,
  isInFolder,
  isPageActionCommand,
} from '@/lib/commandUtils'
import { calcLevel } from '@/services/commandTree'
import { cn } from '@/lib/utils'

interface Props {
  nodes: FlattenNode[]
  folders: CommandFolder[]
  activeNode?: FlattenNode
  onEdit: (index: number) => void
  onRemove: (index: number) => void
  onCopy: (index: number, title: string) => void
  isDroppable: (node: FlattenNode, activeNode?: FlattenNode) => boolean
}

export const CommandTreeRenderer: React.FC<Props> = ({
  nodes,
  folders,
  activeNode,
  onEdit,
  onRemove,
  onCopy,
  isDroppable,
}) => {
  return (
    <>
      {nodes.map((field, index) => (
        <SortableItem
          key={field.id}
          id={field.id}
          index={index}
          level={calcLevel(field, folders)}
          droppable={isDroppable(field, activeNode)}
          content={field.content}
          folders={folders}
          className={cn(
            isFolder(activeNode?.content) &&
              isCommand(field.content) &&
              isInFolder(field.content) &&
              'opacity-50 bg-gray-100',
          )}
        >
          <div className="h-14 pr-2 pl-0 flex-1 flex items-center overflow-hidden">
            <div className="flex-1 flex items-center overflow-hidden pr-2">
              <MenuImage
                src={field.content.iconUrl}
                svg={
                  isFolder(field.content) ? field.content.iconSvg : undefined
                }
                alt={field.content.title}
                className="inline-block w-7 h-7 mr-3"
              />
              <div className="overflow-hidden">
                <p className="text-lg flex flex-row">
                  <span className="text-base truncate">
                    {field.content.title}
                  </span>
                </p>
                {isCommand(field.content) && (
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {field.content.searchUrl}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-0.5 items-center">
              {isPageActionCommand(field.content) && (
                <CopyButton
                  srcTitle={field.content.title}
                  onClick={(title) => onCopy(index, title)}
                />
              )}
              <EditButton onClick={() => onEdit(index)} />
              <RemoveButton
                title={field.content.title}
                iconUrl={field.content.iconUrl}
                iconSvg={
                  isFolder(field.content) ? field.content.iconSvg : undefined
                }
                onRemove={() => onRemove(index)}
              />
            </div>
          </div>
        </SortableItem>
      ))}
    </>
  )
}
