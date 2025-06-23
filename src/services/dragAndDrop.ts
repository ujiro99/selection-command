import type { Active, Over } from '@dnd-kit/core'
import type { Command, CommandFolder } from '@/types'
import type { CommandTreeNode } from '@/services/commandTree'
import { findNodeInTree, findFirstCommand } from '@/services/commandTree'
import { isCommand, isFolder, isCircularReference } from '@/lib/commandUtils'
import { ROOT_FOLDER } from '@/const'

/**
 * Checks if a drag operation between two content items is valid.
 * Prevents invalid drops such as self-drops and circular folder references.
 *
 * @param activeContent - The content being dragged
 * @param overContent - The content being dropped onto
 * @param folders - Array of all folders for circular reference checking
 * @returns true if the drop is valid, false otherwise
 */
export const isValidDrop = (
  activeContent: Command | CommandFolder | null | undefined,
  overContent: Command | CommandFolder | null | undefined,
  folders: CommandFolder[] = [],
): boolean => {
  if (!activeContent || !overContent) return false
  if (activeContent.id === overContent.id) return false

  if (isCommand(activeContent)) return true

  if (isFolder(activeContent) && isFolder(overContent)) {
    return !isCircularReference(activeContent.id, overContent.id, folders)
  }

  return true
}

export type DragInfo = {
  active: Active
  over: Over | null
}

export const isValidDragTarget = (active: Active, over: Over): boolean => {
  if (!active || !over) return false

  const activeData = active.data.current?.content
  const overData = over.data.current?.content
  const folders = active.data.current?.folders || []

  return isValidDrop(activeData, overData, folders)
}

export const isForwardDrag = (active: Active, over: Over): boolean => {
  const activeIndex = active.data.current?.sortable?.index
  const overIndex = over.data.current?.sortable?.index
  return typeof activeIndex === 'number' && typeof overIndex === 'number'
    ? activeIndex < overIndex
    : false
}

export const calculateFolderToFolderPosition = (
  active: Active,
  over: Over,
  commands: Command[],
): { targetIndex: number; newParentId?: string } => {
  const isForward = isForwardDrag(active, over)
  const droppedFolder = over.data.current?.content as CommandFolder
  const firstChildIndex = commands.findIndex(
    (cmd) => cmd.parentFolderId === droppedFolder.id,
  )

  return {
    targetIndex: firstChildIndex >= 0 ? firstChildIndex : commands.length,
    newParentId: isForward
      ? droppedFolder.id
      : droppedFolder.parentFolderId || ROOT_FOLDER,
  }
}

export const calculateFolderToCommandPosition = (
  active: Active,
  over: Over,
  commands: Command[],
): number => {
  const isForward = isForwardDrag(active, over)
  const droppedCommand = over.data.current?.content as Command
  const droppedCommandIndex = commands.findIndex(
    (cmd) => cmd.id === droppedCommand.id,
  )

  if (droppedCommandIndex === -1) return commands.length

  // qqq 上からドラッグした際のインデックスの計算方法
  return isForward ? droppedCommandIndex + 1 : droppedCommandIndex
}

export const calculateCommandToFolderPosition = (
  active: Active,
  over: Over,
  commands: Command[],
  tree: CommandTreeNode[],
): { targetIndex: number; newParentId?: string } => {
  const isForward = isForwardDrag(active, over)
  const droppedFolder = over.data.current?.content as CommandFolder
  const folderNode = findNodeInTree(tree, droppedFolder.id)
  let firstChildIndex = -1
  if (folderNode) {
    const firstCommand = findFirstCommand(folderNode)
    firstChildIndex = commands.findIndex(
      (c) => c.id === firstCommand?.content.id,
    )
  }

  return {
    targetIndex: firstChildIndex >= 0 ? firstChildIndex : commands.length,
    newParentId: isForward
      ? droppedFolder.id
      : droppedFolder.parentFolderId || ROOT_FOLDER,
  }
}
