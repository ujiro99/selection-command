import type { Command, CommandFolder } from "@/types"
import { ROOT_FOLDER, OPTION_FOLDER } from "@/const"

// CommandTreeNode type constants
export const TREE_NODE_TYPE = {
  COMMAND: "command",
  FOLDER: "folder",
} as const

export type CommandTreeNodeType =
  (typeof TREE_NODE_TYPE)[keyof typeof TREE_NODE_TYPE]

export type CommandTreeNode = {
  type: CommandTreeNodeType
  content: Command | CommandFolder
  children?: CommandTreeNode[]
}

export type FlattenNode = {
  id: string
  index: number
  content: Command | CommandFolder
  firstChild?: boolean
  lastChild?: boolean
}

const createFolderNode = (folder: CommandFolder): CommandTreeNode => ({
  type: TREE_NODE_TYPE.FOLDER,
  content: folder,
  children: [],
})

export const findNodeInTree = (
  tree: CommandTreeNode[],
  id: string,
): CommandTreeNode | null => {
  for (const node of tree) {
    if (node.content.id === id) {
      return node
    }
    if (node.children) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

export const findFirstCommand = (
  node: CommandTreeNode,
): CommandTreeNode | null => {
  if (node.children == null) return null
  const first = node.children[0]
  if (first == null) return null
  if (first.type === TREE_NODE_TYPE.FOLDER) return findFirstCommand(first)
  return first
}

const addParentFolderIfNeeded = (
  tree: CommandTreeNode[],
  parentFolderId: string,
  folders: CommandFolder[],
  processedFolders: Set<string>,
  addNodeToTree: (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => void,
) => {
  if (parentFolderId === ROOT_FOLDER) return

  const parentFolder = folders.find((f) => f.id === parentFolderId)
  if (parentFolder && !processedFolders.has(parentFolder.id)) {
    const folderNode = createFolderNode(parentFolder)
    addNodeToTree(tree, folderNode, parentFolder.parentFolderId)
    processedFolders.add(parentFolder.id)
  }
}

const createAddNodeToTreeFunction = (
  folders: CommandFolder[],
  processedFolders: Set<string>,
) => {
  const processingStack = new Set<string>()

  const addNodeToTree = (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => {
    if (parentId && parentId !== ROOT_FOLDER) {
      const parent = findNodeInTree(tree, parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(node)
      } else {
        // Check for circular dependency before processing
        if (processingStack.has(parentId)) {
          console.warn(
            `Circular dependency detected for folder ${parentId}. Adding to root instead.`,
          )
          tree.push(node)
          return
        }

        processingStack.add(parentId)
        addParentFolderIfNeeded(
          tree,
          parentId,
          folders,
          processedFolders,
          addNodeToTree,
        )
        processingStack.delete(parentId)

        // Try again after adding parent
        const parentAfterAdd = findNodeInTree(tree, parentId)
        if (parentAfterAdd) {
          if (!parentAfterAdd.children) parentAfterAdd.children = []
          parentAfterAdd.children.push(node)
        } else {
          console.warn(
            `Failed to find or create parent folder ${parentId}. Adding to root instead.`,
          )
          tree.push(node)
        }
      }
    } else {
      tree.push(node)
    }
  }
  return addNodeToTree
}

const addCommandsToTree = (
  tree: CommandTreeNode[],
  commands: Command[],
  folders: CommandFolder[],
  processedFolders: Set<string>,
  addNodeToTree: (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => void,
) => {
  commands.forEach((command) => {
    const commandNode: CommandTreeNode = {
      type: TREE_NODE_TYPE.COMMAND,
      content: command,
    }

    if (command.parentFolderId && command.parentFolderId !== ROOT_FOLDER) {
      addParentFolderIfNeeded(
        tree,
        command.parentFolderId,
        folders,
        processedFolders,
        addNodeToTree,
      )
    }

    addNodeToTree(tree, commandNode, command.parentFolderId)
  })
}

const addRemainingFoldersToTree = (
  tree: CommandTreeNode[],
  folders: CommandFolder[],
  processedFolders: Set<string>,
  addNodeToTree: (
    tree: CommandTreeNode[],
    node: CommandTreeNode,
    parentId?: string,
  ) => void,
) => {
  folders.forEach((folder) => {
    if (!processedFolders.has(folder.id)) {
      const folderNode = createFolderNode(folder)
      addNodeToTree(tree, folderNode, folder.parentFolderId)
      processedFolders.add(folder.id)
    }
  })
}

export function toCommandTree(
  commands: Command[],
  folders: CommandFolder[],
): CommandTreeNode[] {
  const tree: CommandTreeNode[] = []
  const processedFolders = new Set<string>()
  if (commands == null || (commands.length === 0 && folders.length === 0)) {
    return tree
  }

  const addNodeToTree = createAddNodeToTreeFunction(folders, processedFolders)
  addCommandsToTree(tree, commands, folders, processedFolders, addNodeToTree)
  addRemainingFoldersToTree(tree, folders, processedFolders, addNodeToTree)

  // Sort tree to place OPTION_FOLDER at the end
  tree.sort((a, b) => {
    const aIsOption = a.content.id === OPTION_FOLDER
    const bIsOption = b.content.id === OPTION_FOLDER

    if (aIsOption && !bIsOption) return 1 // a goes to end
    if (!aIsOption && bIsOption) return -1 // b goes to end
    return 0 // maintain relative order for non-option folders
  })

  return tree
}

function _toFlatten(
  tree: CommandTreeNode[],
  flatten: FlattenNode[] = [],
): FlattenNode[] {
  for (const node of tree) {
    if (node.type === TREE_NODE_TYPE.COMMAND) {
      flatten.push({
        id: node.content.id,
        content: node.content,
        index: 0,
      })
    } else {
      flatten.push({
        id: node.content.id,
        content: node.content,
        index: 0,
      })

      if (node.children && node.children.length > 0) {
        const beforeChildrenLength = flatten.length
        _toFlatten(node.children, flatten)
        const afterChildrenLength = flatten.length

        if (beforeChildrenLength < afterChildrenLength) {
          flatten[beforeChildrenLength].firstChild = true
        }
        if (afterChildrenLength > beforeChildrenLength) {
          flatten[afterChildrenLength - 1].lastChild = true
        }
      }
    }
  }
  return flatten
}

export function toFlatten(tree: CommandTreeNode[]): FlattenNode[] {
  let flatten = _toFlatten(tree)
  flatten = flatten.map((node, index) => ({ ...node, index }))
  return flatten
}

export function calcLevel(
  node: FlattenNode | Command | CommandFolder,
  folders: CommandFolder[],
): number {
  const calculateDepth = (parentFolderId?: string): number => {
    if (!parentFolderId || parentFolderId === ROOT_FOLDER) {
      return 0
    }

    const parentFolder = folders.find((f) => f.id === parentFolderId)
    if (!parentFolder) {
      return 0
    }

    return 1 + calculateDepth(parentFolder.parentFolderId)
  }

  // Handle different input types
  const parentFolderId =
    "content" in node ? node.content.parentFolderId : node.parentFolderId

  return calculateDepth(parentFolderId)
}

export function getAllCommandsFromFolder(
  folderNode: CommandTreeNode,
): Command[] {
  const commands: Command[] = []

  const collectCommands = (node: CommandTreeNode) => {
    if (node.type === TREE_NODE_TYPE.COMMAND) {
      commands.push(node.content as Command)
    }

    if (node.children) {
      for (const child of node.children) {
        collectCommands(child)
      }
    }
  }

  collectCommands(folderNode)
  return commands
}

export function getAllFoldersFromNode(node: CommandTreeNode): CommandFolder[] {
  const folders: CommandFolder[] = []

  const collectFolders = (currentNode: CommandTreeNode) => {
    if (currentNode.type === TREE_NODE_TYPE.FOLDER) {
      folders.push(currentNode.content as CommandFolder)
    }

    if (currentNode.children) {
      for (const child of currentNode.children) {
        collectFolders(child)
      }
    }
  }

  collectFolders(node)
  return folders
}
