import { useCallback } from "react"
import type { DragEndEvent } from "@dnd-kit/core"
import type { Command, CommandFolder } from "@/types"
import { isFolder, isCommand } from "@/services/option/commandUtils"
import {
  isValidDragTarget,
  calculateFolderToFolderPosition,
  calculateFolderToCommandPosition,
  calculateCommandToFolderPosition,
} from "@/services/option/dragAndDrop"
import { useCommandActions } from "./useCommandActions"
import { toCommandTree } from "@/services/option/commandTree"

export const useCommandDragDrop = (
  commandActions: ReturnType<typeof useCommandActions>,
  commands: Command[],
  folders: CommandFolder[],
) => {
  const {
    moveCommand,
    moveFolderToFolder,
    moveFolderContents,
    moveCommandToFolder,
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

      // Folder to Folder drag
      if (isFolder(activeContent) && isFolder(overContent)) {
        const { distIndex, firstChildIndex, newParentId } =
          calculateFolderToFolderPosition(active, over, commands, tree)
        moveFolderToFolder(activeContent.id, overContent.id, newParentId)
        moveFolderContents(activeContent.id, distIndex, firstChildIndex)
        return
      }

      // Folder to Command drag
      if (isFolder(activeContent) && isCommand(overContent)) {
        const { distIndex, firstChildIndex } = calculateFolderToCommandPosition(
          active,
          over,
          commands,
          tree,
        )
        moveFolderToFolder(
          activeContent.id,
          overContent.id,
          overContent.parentFolderId,
        )
        moveFolderContents(activeContent.id, distIndex, firstChildIndex)
        return
      }

      // Command to Folder drag
      if (isCommand(activeContent) && isFolder(overContent)) {
        const { distIndex, newParentId } = calculateCommandToFolderPosition(
          active,
          over,
          commands,
          tree,
        )
        moveCommandToFolder(activeContent.id, distIndex, newParentId)
        return
      }

      // Command to Command drag
      if (isCommand(activeContent) && isCommand(overContent)) {
        const activeIndex = commands.findIndex(
          (cmd) => cmd.id === activeContent.id,
        )
        const overIndex = commands.findIndex((cmd) => cmd.id === overContent.id)

        if (activeIndex !== -1 && overIndex !== -1) {
          // First, move command to same parent folder as target command
          if (activeContent.parentFolderId !== overContent.parentFolderId) {
            moveCommandToFolder(
              activeContent.id,
              overIndex,
              overContent.parentFolderId,
            )
          } else {
            // If already in same parent, just move position
            moveCommand(activeIndex, overIndex)
          }
        }
      }
    },
    [
      tree,
      commands,
      moveFolderToFolder,
      moveFolderContents,
      moveCommand,
      moveCommandToFolder,
    ],
  )

  return { handleDragEnd }
}
