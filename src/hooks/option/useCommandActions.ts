import { useCallback, useMemo, useEffect } from 'react'
import { useFieldArray } from 'react-hook-form'
import { usePrevious } from '@/hooks/usePrevious'
import { ROOT_FOLDER } from '@/const'
import type { CommandFolder } from '@/types'
import { CommandsSchemaType, FoldersSchemaType } from '@/types/schema'
import {
  isFolder,
  isDescendantOf,
  isCircularReference,
} from '@/services/option/commandUtils'
import {
  toFlatten,
  findNodeInTree,
  getAllCommandsFromFolder,
  getAllFoldersFromNode,
} from '@/services/option/commandTree'
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
    for (let i = from + 1; i <= to; i++) {
      if (
        isFolder(flatten[i].content) &&
        !isDescendantOf(flatten[i].id, flatten[from].id, folders)
      ) {
        return flatten[i]
      }
    }
  } else {
    for (let i = from - 1; i >= to; i--) {
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

/**
 * Helper function to find array index by ID
 * @param array - Array to search
 * @param id - ID to find
 * @returns Index of the item, or -1 if not found
 */
const findIndexById = <T extends { id: string }>(
  array: T[],
  id: string,
): number => {
  return array.findIndex((item) => item.id === id)
}

/**
 * Helper function to move child items to root folder
 * @param items - Array of items with parentFolderId
 * @param targetId - ID of the parent to match
 * @param updateFn - Function to update the item
 */
const moveChildrenToRoot = <T extends { parentFolderId?: string }>(
  items: (T & { index: number })[],
  targetId: string,
  updateFn: (index: number, item: T) => void,
): void => {
  const children = items.filter((item) => item.parentFolderId === targetId)
  children.forEach((child) => {
    updateFn(child.index, {
      ...child,
      parentFolderId: ROOT_FOLDER,
    })
  })
}

/**
 * Helper function to determine target folder index when dropping
 * @param overContent - The content being dragged over
 * @param overContentId - ID of the content being dragged over
 * @param sourceFolderId - ID of the source folder
 * @param flatten - Flattened node array
 * @param folderArray - Array of all folders
 * @returns Target folder index or -1 if not found
 */
const getTargetFolderIndex = (
  overContent: CommandTreeNode | null,
  overContentId: string,
  sourceFolderId: string,
  flatten: FlattenNode[],
  folderArray: ReturnType<typeof useFieldArray<FoldersSchemaType, 'folders'>>,
): number => {
  if (overContent?.type === 'folder') {
    return findIndexById(folderArray.fields, overContentId)
  } else {
    // When the drop target is a command, find a folder between the dragged folder and the target
    const from = findIndexById(flatten, sourceFolderId)
    const to = findIndexById(flatten, overContentId)
    const folder = findFolder(flatten, folderArray.fields, from, to)
    return folder ? findIndexById(folderArray.fields, folder.id) : -1
  }
}

/**
 * Helper function to move sub-folders in the correct order
 * @param sourceFolder - The source folder node
 * @param sourceFolderIndex - Index of the source folder
 * @param distFolderIndex - Index of the destination folder
 * @param folderArray - Array of all folders
 */
const moveSubFolders = (
  sourceFolder: CommandTreeNode,
  sourceFolderIndex: number,
  distFolderIndex: number,
  folderArray: ReturnType<typeof useFieldArray<FoldersSchemaType, 'folders'>>,
): void => {
  const isForwardDrag = distFolderIndex > sourceFolderIndex
  const subFolders = getAllFoldersFromNode(sourceFolder)

  if (isForwardDrag) {
    subFolders.forEach(() => {
      folderArray.move(sourceFolderIndex, distFolderIndex)
    })
  } else {
    let currentDistIndex = distFolderIndex
    subFolders.forEach((f) => {
      const idx = findIndexById(folderArray.fields, f.id)
      folderArray.move(idx, currentDistIndex)
      currentDistIndex++
    })
  }
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
  const flatten = useMemo(() => toFlatten(tree), [tree])
  const prevFlatten = usePrevious(flatten)

  useEffect(() => {
    if (!prevFlatten) return
    const prevFolders = prevFlatten
      .filter((node) => isFolder(node.content))
      .map((node) => node.id)
    const currentFolders = flatten
      .filter((node) => isFolder(node.content))
      .map((node) => node.id)

    // Check if the folder order has changed.
    const folderOrderChanged = prevFolders.some((prev, idx) => {
      const currentIdx = currentFolders.findIndex((current) => current === prev)
      return currentIdx !== idx
    })

    // Reorder folderArray.fields to match flatten.
    if (folderOrderChanged) {
      // 1. Remove all folders first.
      currentFolders.forEach(() => folderArray.remove(0))
      // 2. Append folders in the correct order.
      currentFolders.forEach((folderId) => {
        const idx = folderArray.fields.findIndex((f) => f.id === folderId)
        if (idx > -1) {
          const cur = folderArray.fields[idx]
          folderArray.append(cur)
        }
      })
    }
  }, [flatten, prevFlatten, folderArray])

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
   * @param overContentId - ID of the content that is being dragged over
   * @param distFolderId - ID of the target parent folder (defaults to ROOT_FOLDER)
   */
  const moveFolderToFolder = useCallback(
    (
      sourceFolderId: string,
      overContentId: string,
      distFolderId = ROOT_FOLDER,
    ) => {
      if (
        isCircularReference(sourceFolderId, distFolderId, folderArray.fields)
      ) {
        return
      }

      const sourceFolder = findNodeInTree(tree, sourceFolderId)
      const overContent = findNodeInTree(tree, overContentId)
      if (!sourceFolder) {
        return
      }

      const sourceFolderIndex = findIndexById(
        folderArray.fields,
        sourceFolderId,
      )
      const distFolderIndex = getTargetFolderIndex(
        overContent,
        overContentId,
        sourceFolderId,
        flatten,
        folderArray,
      )

      if (sourceFolderIndex >= 0) {
        folderArray.update(sourceFolderIndex, {
          ...sourceFolder.content,
          parentFolderId: distFolderId,
        })

        if (sourceFolderIndex !== distFolderIndex && distFolderIndex >= 0) {
          moveSubFolders(
            sourceFolder,
            sourceFolderIndex,
            distFolderIndex,
            folderArray,
          )
        }
      }
    },
    [folderArray, tree, flatten],
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
          const idx = findIndexById(commandArray.fields, cmd.id)
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
      const idx = findIndexById(commandArray.fields, commandId)
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
      const commandIndex = findIndexById(commandArray.fields, id)
      if (commandIndex >= 0) {
        commandArray.remove(commandIndex)
        return
      }

      const folderIndex = findIndexById(folderArray.fields, id)
      if (folderIndex >= 0) {
        // Move child commands to root when removing folder
        const childCommands = commandArray.fields.map((cmd, index) => ({
          ...cmd,
          index,
        }))
        const childFolders = folderArray.fields.map((folder, index) => ({
          ...folder,
          index,
        }))

        moveChildrenToRoot(childCommands, id, (index, item) => {
          commandArray.update(index, item)
        })

        moveChildrenToRoot(childFolders, id, (index, item) => {
          folderArray.update(index, item)
        })

        folderArray.remove(folderIndex)
      }
    },
    [commandArray, folderArray],
  )

  return {
    moveCommand,
    moveCommandToFolder,
    commandRemove,
    moveFolderToFolder,
    moveFolderContents,
  }
}
