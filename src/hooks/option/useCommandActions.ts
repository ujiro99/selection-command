import { useCallback } from 'react'
import { useFieldArray } from 'react-hook-form'
import { isCircularReference } from '@/services/option/commandUtils'
import { ROOT_FOLDER } from '@/const'
import type { CommandFolder } from '@/types'
import { CommandsSchemaType, FoldersSchemaType } from '@/types/schema'
import {
  toFlatten,
  findNodeInTree,
  getAllCommandsFromFolder,
  getAllFoldersFromNode,
} from '@/services/option/commandTree'
import { isFolder, isDescendantOf } from '@/services/option/commandUtils'
import type {
  CommandTreeNode,
  FlattenNode,
} from '@/services/option/commandTree'

/**
 * Finds the appropriate folder between two positions in a flattened node array
 * Used during drag operations to determine the target folder when dropping a command or folder
 * @param flatten - Array of flattened nodes (commands and folders in display order)
 * @param folders - Array of all folders for hierarchy checking
 * @param from - Starting position index of the dragged item
 * @param to - Target position index where the item is being dropped
 * @returns The folder node that should be the target, or null if no suitable folder is found
 */
const findFolder = (
  flatten: FlattenNode[],
  folders: CommandFolder[],
  from: number,
  to: number,
): FlattenNode | null => {
  const isForwardDrag = to > from
  if (isForwardDrag) {
    for (let i = from + 1; i < to; i++) {
      if (
        isFolder(flatten[i].content) &&
        !isDescendantOf(flatten[i].id, flatten[from].id, folders)
      ) {
        return flatten[i]
      }
    }
  } else {
    for (let i = from - 1; i > to; i--) {
      if (
        isFolder(flatten[i].content) &&
        !isDescendantOf(flatten[i].id, flatten[from].id, folders)
      ) {
        return flatten[i]
      }
    }
  }
  return null
}

/*
 * Custom hook that provides actions for managing commands and folders in the command editor.
 * Handles moving, organizing, and removing commands and folders with proper hierarchy management.
 *
 * @param commandArray - React Hook Form field array for commands
 * @param folderArray - React Hook Form field array for folders
 * @returns Object containing command and folder management functions
 */
export const useCommandActions = (
  commandArray: ReturnType<
    typeof useFieldArray<CommandsSchemaType, 'commands'>
  >,
  folderArray: ReturnType<typeof useFieldArray<FoldersSchemaType, 'folders'>>,
  tree: CommandTreeNode[],
) => {
  const flatten = toFlatten(tree)

  /**
   * Moves a command from one position to another in the commands array
   * @param from - Source index of the command
   * @param to - Target index where the command should be moved
   */
  const moveCommand = useCallback(
    (from: number, to: number) => {
      commandArray.move(from, to)
    },
    [commandArray],
  )

  /**
   * Moves a folder to become a child of another folder
   * Prevents circular references by checking folder hierarchy
   * @param sourceFolderId - ID of the folder to move
   * @param overContentid - ID of the content that is being dragged over
   * @param distFolderId - ID of the target parent folder (defaults to ROOT_FOLDER)
   */
  const moveFolderToFolder = useCallback(
    (
      sourceFolderId: string,
      overContentId: string,
      distFolderId = ROOT_FOLDER,
    ) => {
      if (
        isCircularReference(
          sourceFolderId,
          distFolderId,
          folderArray.fields as any,
        )
      ) {
        return
      }

      const sourceFolder = findNodeInTree(tree, sourceFolderId)
      const overContent = findNodeInTree(tree, overContentId)
      if (!sourceFolder) {
        return
      }
      const sourceFolderIndex = folderArray.fields.findIndex(
        (f) => f.id === sourceFolderId,
      )
      let distFolderIndex = -1
      if (overContent?.type === 'folder') {
        distFolderIndex = folderArray.fields.findIndex(
          (f) => f.id === overContentId,
        )
      } else {
        // When the drop target is a command, find a folder between the dragged folder and the target
        const from = flatten.findIndex((f) => f.id === sourceFolderId)
        const to = flatten.findIndex((f) => f.id === overContentId)
        const folder = findFolder(flatten, folderArray.fields, from, to)
        if (folder) {
          distFolderIndex = folderArray.fields.findIndex(
            (f) => f.id === folder.id,
          )
        }
      }

      if (sourceFolderIndex >= 0) {
        folderArray.update(sourceFolderIndex, {
          ...sourceFolder.content,
          parentFolderId: distFolderId,
        })
        if (sourceFolderIndex !== distFolderIndex && distFolderIndex >= 0) {
          const isForwardDrag = distFolderIndex > sourceFolderIndex
          const subFolders = getAllFoldersFromNode(sourceFolder)
          if (isForwardDrag) {
            subFolders.forEach(() => {
              folderArray.move(sourceFolderIndex, distFolderIndex)
            })
          } else {
            let currentDistIndex = distFolderIndex
            subFolders.forEach((f) => {
              const idx = folderArray.fields.findIndex((c) => c.id === f.id)
              folderArray.move(idx, currentDistIndex)
              currentDistIndex++
            })
          }
        }
      }
    },
    [folderArray],
  )

  /**
   * Moves all commands within a folder to a new position in the commands array
   * Handles both forward and backward drag operations to maintain correct order
   * @param sourceFolderId - ID of the folder whose contents should be moved
   * @param distIndex - Target index where the folder contents should be positioned
   * @param firstChildIndex - Index of the first command in the folder
   */
  const moveFolderContents = useCallback(
    (sourceFolderId: string, distIndex: number, firstChildIndex: number) => {
      const folderNode = findNodeInTree(tree, sourceFolderId)
      if (!folderNode) {
        return
      }
      const folderCommands = getAllCommandsFromFolder(folderNode)
      const isForwardDrag = distIndex > firstChildIndex
      if (isForwardDrag) {
        folderCommands.forEach(() => {
          moveCommand(firstChildIndex, distIndex)
        })
      } else {
        let currentDistIndex = distIndex
        folderCommands.forEach((cmd) => {
          const idx = commandArray.fields.findIndex((c) => c.id === cmd.id)
          moveCommand(idx, currentDistIndex)
          currentDistIndex++
        })
      }
    },
    [tree, commandArray, moveCommand],
  )

  /**
   * Moves a command to a specific folder and position
   * Updates both the parent folder assignment and the position in the commands array
   * @param commandId - ID of the command to move
   * @param distIndex - Target index where the command should be positioned
   * @param parentId - ID of the target parent folder (defaults to ROOT_FOLDER)
   */
  const moveCommandToFolder = useCallback(
    (commandId: string, distIndex: number, parentId = ROOT_FOLDER) => {
      const idx = commandArray.fields.findIndex((c) => c.id === commandId)
      if (idx >= 0) {
        const command = commandArray.fields[idx]
        // Update parent folder first
        commandArray.update(idx, {
          ...command,
          parentFolderId: parentId,
        })
        // Then move to target position
        moveCommand(idx, distIndex)
      }
    },
    [commandArray, moveCommand],
  )

  /**
   * Removes a command or folder from the arrays
   * When removing a folder, moves all child commands and folders to the root folder
   * @param id - ID of the command or folder to remove
   */
  const commandRemove = useCallback(
    (id: string) => {
      const commandIndex = commandArray.fields.findIndex((c) => c.id === id)
      if (commandIndex >= 0) {
        commandArray.remove(commandIndex)
        return
      }

      const folderIndex = folderArray.fields.findIndex((f) => f.id === id)
      if (folderIndex >= 0) {
        // Move child commands to root when removing folder
        const childCommands = commandArray.fields
          .map((cmd, index) => ({ ...cmd, index }))
          .filter((cmd: any) => cmd.parentFolderId === id)

        childCommands.forEach((cmd) => {
          commandArray.update(cmd.index, {
            ...cmd,
            parentFolderId: ROOT_FOLDER,
          })
        })

        const childFolders = folderArray.fields
          .map((folder, index) => ({ ...folder, index }))
          .filter((folder: any) => folder.parentFolderId === id)

        childFolders.forEach((folder) => {
          folderArray.update(folder.index, {
            ...folder,
            parentFolderId: ROOT_FOLDER,
          })
        })

        folderArray.remove(folderIndex)
      }
    },
    [tree, commandArray, folderArray],
  )

  return {
    moveCommand,
    moveCommandToFolder,
    commandRemove,
    moveFolderToFolder,
    moveFolderContents,
  }
}
