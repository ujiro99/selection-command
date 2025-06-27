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
  tree: CommandTreeNode[],
): { distIndex: number; firstChildIndex: number; newParentId: string } => {
  const isForward = isForwardDrag(active, over)
  const activeFolder = active.data.current?.content as CommandFolder
  const activeNode = findNodeInTree(tree, activeFolder.id)
  const overFolder = over.data.current?.content as CommandFolder
  const overNode = findNodeInTree(tree, overFolder.id)

  let firstChildIndex = -1
  if (activeNode) {
    const firstCommand = findFirstCommand(activeNode)
    firstChildIndex = commands.findIndex(
      (c) => c.id === firstCommand?.content.id,
    )
  }

  let distIndex = commands.length
  if (overNode) {
    const firstCommand = findFirstCommand(overNode)
    distIndex = commands.findIndex((c) => c.id === firstCommand?.content.id)
  }

  return {
    distIndex: isForward ? distIndex - 1 : distIndex,
    firstChildIndex,
    newParentId: isForward
      ? overFolder.id
      : overFolder.parentFolderId || ROOT_FOLDER,
  }
}

export const calculateFolderToCommandPosition = (
  active: Active,
  over: Over,
  commands: Command[],
  tree: CommandTreeNode[],
): { distIndex: number; firstChildIndex: number } => {
  const overCommand = over.data.current?.content as Command
  const overCommandIndex = commands.findIndex(
    (cmd) => cmd.id === overCommand.id,
  )

  let firstChildIndex = -1
  const folderNode = findNodeInTree(tree, active.data.current?.content.id)
  if (folderNode) {
    const firstCommand = findFirstCommand(folderNode)
    firstChildIndex = commands.findIndex(
      (c) => c.id === firstCommand?.content.id,
    )
  }

  if (overCommandIndex === -1)
    return { distIndex: commands.length, firstChildIndex }

  return {
    distIndex: overCommandIndex,
    firstChildIndex,
  }
}

export const calculateCommandToFolderPosition = (
  active: Active,
  over: Over,
  commands: Command[],
  tree: CommandTreeNode[],
): { distIndex: number; newParentId?: string } => {
  const isForward = isForwardDrag(active, over)
  const overFolder = over.data.current?.content as CommandFolder
  const overNode = findNodeInTree(tree, overFolder.id)

  let firstChildIndex = commands.length
  if (overNode) {
    const firstCommand = findFirstCommand(overNode)
    firstChildIndex = commands.findIndex(
      (c) => c.id === firstCommand?.content.id,
    )
  }

  return {
    distIndex: isForward ? firstChildIndex - 1 : firstChildIndex,
    newParentId: isForward
      ? overFolder.id
      : overFolder.parentFolderId || ROOT_FOLDER,
  }
}
