import { useCallback } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Command, CommandFolder } from '@/types'
import { isFolder, isCommand } from '@/lib/commandUtils'
import {
  isValidDragTarget,
  calculateFolderToFolderPosition,
  calculateFolderToCommandPosition,
  calculateCommandToFolderPosition,
} from '@/services/dragAndDrop'
import { useCommandActions } from './useCommandActions'
import { toCommandTree } from '@/services/commandTree'

export const useCommandDragDrop = (
  commandActions: ReturnType<typeof useCommandActions>,
  commands: Command[],
  folders: CommandFolder[],
) => {
  const {
    moveCommands,
    moveFolderAsSubfolder,
    moveFolderToSameLevel,
    moveFolderContents,
    moveCommandIntoFolder,
    moveCommandToSameLevel,
  } = commandActions
  const tree = toCommandTree(commands, folders)

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over || !isValidDragTarget(active, over)) {
        return
      }

      const activeContent = active.data.current?.content
      const overContent = over.data.current?.content

      console.log('from', activeContent.title, 'dist', overContent.title)

      // Folder to Folder drag
      if (isFolder(activeContent) && isFolder(overContent)) {
        const { targetIndex, newParentId } = calculateFolderToFolderPosition(
          active,
          over,
          commands,
        )

        if (newParentId) {
          // Move as subfolder
          moveFolderAsSubfolder(activeContent.id, newParentId)
        } else {
          // Move to same level
          moveFolderToSameLevel(activeContent.id, overContent.parentFolderId)
        }

        moveFolderContents(activeContent.id, commands, targetIndex)
        return
      }

      // Folder to Command drag
      if (isFolder(activeContent) && isCommand(overContent)) {
        const targetIndex = calculateFolderToCommandPosition(
          active,
          over,
          commands,
        )
        // Always move folder to same level as command
        moveFolderToSameLevel(activeContent.id, overContent.parentFolderId)
        moveFolderContents(activeContent.id, commands, targetIndex)
        return
      }

      // Command to Folder drag
      if (isCommand(activeContent) && isFolder(overContent)) {
        const { targetIndex, newParentId } = calculateCommandToFolderPosition(
          active,
          over,
          commands,
          tree,
        )

        if (newParentId) {
          // Move command into folder or to same level
          if (newParentId === overContent.id) {
            // 2-2-1: Move command into folder
            moveCommandIntoFolder(activeContent.id, newParentId)
          } else {
            // 2-2-2: Move command to same level as folder (parent folder)
            moveCommandToSameLevel(activeContent.id, newParentId, targetIndex)
          }
        }
        return
      }

      // Command to Command drag (original functionality)
      if (isCommand(activeContent) && isCommand(overContent)) {
        const activeIndex = commands.findIndex(
          (cmd) => cmd.id === activeContent.id,
        )
        const overIndex = commands.findIndex((cmd) => cmd.id === overContent.id)

        if (activeIndex !== -1 && overIndex !== -1) {
          // First, move command to same parent folder as target command
          if (activeContent.parentFolderId !== overContent.parentFolderId) {
            moveCommandToSameLevel(
              activeContent.id,
              overContent.parentFolderId,
              overIndex,
            )
          } else {
            // If already in same parent, just move position
            moveCommands(activeIndex, overIndex)
          }
        }
      }
    },
    [
      commands,
      moveCommands,
      moveFolderAsSubfolder,
      moveFolderToSameLevel,
      moveFolderContents,
      moveCommandIntoFolder,
      moveCommandToSameLevel,
    ],
  )

  return { handleDragEnd }
}
