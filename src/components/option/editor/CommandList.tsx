import { useState, useRef, useEffect } from 'react'
import { useFieldArray } from 'react-hook-form'
import { z } from 'zod'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { Terminal, FolderPlus, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/Tooltip'
import { SortableItem } from '@/components/option/SortableItem'
import { EditButton } from '@/components/option/EditButton'
import { CopyButton } from '@/components/option/CopyButton'
import { RemoveButton } from '@/components/option/RemoveButton'
import {
  commandSchema,
  CommandEditDialog,
} from '@/components/option/editor/CommandEditDialog'
import {
  FolderEditDialog,
  folderSchema,
} from '@/components/option/editor/FolderEditDialog'
import { MenuImage } from '@/components/menu/MenuImage'

import { ANALYTICS_EVENTS, sendEvent } from '@/services/analytics'
import { SCREEN } from '@/const'
import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { OPEN_MODE, ROOT_FOLDER, COMMAND_MAX, HUB_URL } from '@/const'
import { cn, e2a, isEmpty } from '@/lib/utils'
import type {
  Command,
  CommandFolder,
  SelectionCommand,
  PageActionCommand,
} from '@/types'

const commandsSchema = z.object({
  commands: z.array(commandSchema).min(1).max(COMMAND_MAX),
})

const foldersSchema = z.object({
  folders: z.array(folderSchema),
})

type CommandSchemaType = z.infer<typeof commandSchema>
type CommandsSchemaType = z.infer<typeof commandsSchema>
type FoldersSchemType = z.infer<typeof foldersSchema>

type CommandTreeNode = {
  type: 'command' | 'folder'
  content: Command | CommandFolder
  children?: CommandTreeNode[]
}

export function toCommandTree(
  commands: Command[],
  folders: CommandFolder[],
): CommandTreeNode[] {
  // フォルダーノードを作成する関数
  const createFolderNode = (folder: CommandFolder): CommandTreeNode => ({
    type: 'folder',
    content: folder,
    children: [],
  })

  // ツリー内でノードを検索する関数
  const findNodeInTree = (
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

  // ノードをツリーに追加する関数
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
        // 親フォルダーがまだない場合は、先に親フォルダーを追加
        const parentFolder = folders.find((f) => f.id === parentId)
        if (parentFolder && !addedFolders.has(parentFolder.id)) {
          const parentNode = createFolderNode(parentFolder)
          addedFolders.add(parentFolder.id) // 重複防止のため追加
          addNodeToTree(tree, parentNode, parentFolder.parentFolderId)
          addNodeToTree(tree, node, parentId) // 再帰的に追加
        } else if (parentFolder && addedFolders.has(parentFolder.id)) {
          // 既に追加済みの場合は、ツリーから再検索
          const existingParent = findNodeInTree(tree, parentId)
          if (existingParent) {
            if (!existingParent.children) existingParent.children = []
            existingParent.children.push(node)
          }
        }
      }
    } else {
      // ルートレベルに追加
      tree.push(node)
    }
  }

  let tree: CommandTreeNode[] = []
  const addedFolders = new Set<string>()

  // まずフォルダーを階層的に追加
  folders.forEach((folder) => {
    if (!addedFolders.has(folder.id)) {
      const folderNode = createFolderNode(folder)
      addNodeToTree(tree, folderNode, folder.parentFolderId)
      addedFolders.add(folder.id)
    }
  })

  // 次にコマンドを適切な位置に追加
  commands.forEach((command) => {
    const commandNode: CommandTreeNode = {
      type: 'command',
      content: command,
    }
    addNodeToTree(tree, commandNode, command.parentFolderId)
  })

  return tree
}

type FlattenNode = {
  id: string
  index: number
  content: SelectionCommand | CommandFolder
  firstChild?: boolean
  lastChild?: boolean
}

function _toFlatten(
  tree: CommandTreeNode[],
  flatten: FlattenNode[] = [],
): FlattenNode[] {
  for (const node of tree) {
    if (node.type === 'command') {
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

        // 最初の子要素にfirstChildマークを設定
        if (beforeChildrenLength < afterChildrenLength) {
          flatten[beforeChildrenLength].firstChild = true
        }
        // 最後の子要素にlastChildマークを設定
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

function commandsFilter(
  nodes: FlattenNode[],
  draggingId?: string | null,
): FlattenNode[] {
  return nodes.filter((node) => {
    if (isCommand(node.content)) {
      if (node.content.parentFolderId === draggingId) return false
    }
    return true
  })
}

function isCircularReference(
  draggedFolderId: string,
  targetFolderId: string,
  folders: CommandFolder[],
): boolean {
  // draggedFolderIdがtargetFolderIdの子孫フォルダーかチェック
  const findDescendants = (folderId: string): string[] => {
    const children = folders.filter((f) => f.parentFolderId === folderId)
    let descendants = children.map((f) => f.id)
    for (const child of children) {
      descendants = descendants.concat(findDescendants(child.id))
    }
    return descendants
  }

  const descendants = findDescendants(draggedFolderId)
  return descendants.includes(targetFolderId)
}

function isDroppable(
  selfNode: FlattenNode,
  activeNode?: FlattenNode,
  folders: CommandFolder[] = [],
): boolean {
  if (!activeNode) return true
  if (isCommand(activeNode.content)) return true

  // フォルダーの場合は循環参照チェック
  if (isFolder(selfNode.content)) {
    return !isCircularReference(
      activeNode.content.id,
      selfNode.content.id,
      folders,
    )
  }

  const isMoveDown = activeNode.index < selfNode.index
  if (isMoveDown) {
    if (isInFolder(selfNode.content) && !selfNode.lastChild) return false
  } else {
    if (isInFolder(selfNode.content) && !selfNode.firstChild) return false
  }
  return true
}

export function isCommand(
  content: Command | CommandFolder | undefined,
): content is SelectionCommand {
  if (content == null) return false
  if ('openMode' in content) {
    return e2a(OPEN_MODE).includes(content.openMode)
  }
  return false
}

export function isPageActionCommand(
  content: Command | CommandFolder | undefined,
): content is PageActionCommand {
  if (content == null) return false
  if ('openMode' in content) {
    return OPEN_MODE.PAGE_ACTION === content.openMode
  }
  return false
}

function isFolder(
  content: Command | CommandFolder | undefined,
): content is CommandFolder {
  if (content == null) return false
  return !('openMode' in content)
}

function isInFolder(content: Command | CommandFolder | undefined): boolean {
  if (content == null) return false
  const folderId = content.parentFolderId
  if (!isEmpty(folderId) && folderId != ROOT_FOLDER) {
    return true
  }
  return false
}

export function removeUnstoredParam(data: Command) {
  delete (data as any)._id
  return data
}

function calcLevel(node: FlattenNode, folders: CommandFolder[]): number {
  // 再帰的に親フォルダーをたどってレベルを計算
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

  if (isCommand(node.content)) {
    return calculateDepth(node.content.parentFolderId)
  } else if (isFolder(node.content)) {
    return calculateDepth(node.content.parentFolderId)
  }

  return 0
}

type CommandListProps = {
  control: any
}

export const CommandList = ({ control }: CommandListProps) => {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [commandDialogOpen, _setCommandDialogOpen] = useState(false)
  const [folderDialogOpen, _setFolderDialogOpen] = useState(false)
  const addCommandButtonRef = useRef<HTMLButtonElement>(null)
  const addFolderButtonRef = useRef<HTMLButtonElement>(null)
  const commandsRef = useRef<HTMLUListElement>(null)
  const editDataRef = useRef<Command | CommandFolder | null>(null)

  const commandArray = useFieldArray<CommandsSchemaType, 'commands', '_id'>({
    name: 'commands',
    control: control,
    keyName: '_id',
  })

  const folderArray = useFieldArray<FoldersSchemType, 'folders', '_id'>({
    name: 'folders',
    control: control,
    keyName: '_id',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const commandTree = toCommandTree(commandArray.fields, folderArray.fields)
  let flatten = toFlatten(commandTree)
  flatten = commandsFilter(flatten, draggingId)
  const activeNode = flatten.find((f) => f.id === draggingId)

  const setCommandDialogOpen = (open: boolean) => {
    if (!open) {
      // Reset editData when closing the dialog.
      editDataRef.current = null
    } else {
      sendEvent(
        ANALYTICS_EVENTS.OPEN_DIALOG,
        {
          event_label: 'command_edit',
        },
        SCREEN.OPTION,
      )
    }
    _setCommandDialogOpen(open)
  }

  const setFolderDialogOpen = (open: boolean) => {
    if (!open) {
      // Reset editData when closing the dialog.
      editDataRef.current = null
    }
    _setFolderDialogOpen(open)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggingId(active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null)
    const { active, over } = event
    if (!active || !over) return
    if (active.id !== over?.id) {
      moveArray(`${active.id}`, `${over.id}`)
    }
  }

  const moveCommands = (srcIdxs: number[], distIdx: number) => {
    const sortedIndexes = [...srcIdxs].sort((a, b) => b - a)
    const itemsToMove = sortedIndexes.map((index) => commandArray.fields[index])
    sortedIndexes.forEach((index) => commandArray.remove(index))

    const isMoveDown = srcIdxs[0] < distIdx
    if (isMoveDown) distIdx -= srcIdxs.length - 1
    itemsToMove.reverse().forEach((item, i) => {
      commandArray.insert(distIdx + i, item)
    })
  }

  const commandEditorOpen = (idx: number) => {
    const node = flatten[idx]
    editDataRef.current = node.content
    if (isCommand(node.content)) {
      setCommandDialogOpen(true)
    } else {
      setFolderDialogOpen(true)
    }
  }

  const commandUpsert = (data: SelectionCommand | CommandFolder) => {
    if (isCommand(data)) {
      const idx = commandArray.fields.findIndex((f) => f.id === data.id)
      if (idx >= 0) {
        commandArray.update(idx, data as CommandSchemaType)
        sendEvent(
          ANALYTICS_EVENTS.COMMAND_EDIT,
          {
            event_label: data.openMode,
          },
          SCREEN.OPTION,
        )
      } else {
        commandArray.append(data as CommandSchemaType)
        sendEvent(
          ANALYTICS_EVENTS.COMMAND_ADD,
          {
            event_label: data.openMode,
          },
          SCREEN.OPTION,
        )
      }
    } else {
      const idx = folderArray.fields.findIndex((f) => f.id === data.id)
      if (idx >= 0) {
        folderArray.update(idx, data)
      } else {
        folderArray.append(data)
      }
    }
  }

  const commandCopy = (idx: number, title: string) => {
    const node = flatten[idx]
    if (isFolder(node.content)) {
      return
    }
    const index = commandArray.fields.findIndex((f) => f.id === node.id)
    if (index < 0) return
    const cmd = commandArray.fields[index]
    cmd.id = crypto.randomUUID()
    cmd.title = title
    commandArray.insert(index + 1, cmd)
  }

  const commandRemove = (idx: number) => {
    const node = flatten[idx]
    if (isCommand(node.content)) {
      commandArray.remove(
        commandArray.fields.findIndex((f) => f.id === node.id),
      )
      sendEvent(
        ANALYTICS_EVENTS.COMMAND_REMOVE,
        {
          event_label: node.content.openMode,
        },
        SCREEN.OPTION,
      )
    } else {
      commandArray.fields
        .map((f, i) => ({
          index: i,
          id: f.id,
          parentFolderId: f.parentFolderId,
          data: f,
        }))
        .filter((f) => f.parentFolderId === node.id)
        .forEach((f) =>
          commandArray.update(f.index, {
            ...f.data,
            parentFolderId: undefined,
          }),
        )
      folderArray.remove(folderArray.fields.findIndex((f) => f.id === node.id))
    }
  }

  const commandIdx = (id: string) =>
    commandArray.fields.findIndex((f) => f.id === id)

  const moveArray = (srcId: string, distId: string) => {
    const srcNode = flatten.find((f) => f.id === srcId)
    const distNode = flatten.find((f) => f.id === distId)
    if (!srcNode || !distNode) return

    const isMoveDown =
      flatten.findIndex((f) => f.id === srcId) <
      flatten.findIndex((f) => f.id === distId)

    if (isCommand(srcNode.content)) {
      const srcIdx = commandIdx(srcId)
      if (isCommand(distNode.content)) {
        // command to command
        const distIdx = commandIdx(distId)
        commandArray.update(srcIdx, {
          ...srcNode.content,
          parentFolderId: distNode.content.parentFolderId,
        } as CommandSchemaType)
        commandArray.move(srcIdx, distIdx)
      } else {
        // command to folder
        let distIdx = commandArray.fields.findIndex(
          (f) => f.parentFolderId === distId,
        )
        if (distIdx === -1) {
          // Empty folders always exist at the end of the list, so move to the end of the dommands.
          distIdx = commandArray.fields.length
        }
        commandArray.update(srcIdx, {
          ...srcNode.content,
          parentFolderId: isMoveDown ? distId : undefined,
        } as CommandSchemaType)
        commandArray.move(srcIdx, isMoveDown ? distIdx - 1 : distIdx)
      }
    } else {
      const srcIdxs = commandArray.fields
        .filter((f) => f.parentFolderId === srcId)
        .map((f) => commandIdx(f.id))
      if (isCommand(distNode.content)) {
        // folder to command
        const distIdx = commandIdx(distId)
        moveCommands(srcIdxs, distIdx)
      } else {
        // folder to folder
        const distIdx = commandArray.fields.findIndex(
          (f) => f.parentFolderId === distId,
        )
        moveCommands(srcIdxs, distIdx)
      }
    }
  }

  useEffect(() => {
    commandsRef.current?.style.setProperty(
      'height',
      commandsRef.current.scrollHeight + 'px',
    )
  }, [commandArray.fields, folderArray.fields])

  return (
    <>
      <div className="relative h-10 flex items-end">
        <span className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono tracking-tight">
          {commandArray.fields.length ?? 0}
          {t('commands_desc_count')}
        </span>
        <Button
          type="button"
          ref={addFolderButtonRef}
          variant="outline"
          className="absolute left-[255px] px-2 w-24 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group font-mono"
          onClick={() => setFolderDialogOpen(true)}
        >
          <FolderPlus />
          {t('folders')}
        </Button>
        <Tooltip
          positionElm={addFolderButtonRef.current}
          text={t('folders_tooltip')}
        />
        <Button
          type="button"
          ref={addCommandButtonRef}
          variant="outline"
          className="absolute left-[360px] px-2 w-24 rounded-md transition hover:bg-gray-100 hover:mr-1 hover:scale-[110%] group font-mono"
          onClick={() => setCommandDialogOpen(true)}
        >
          <Terminal className="stroke-gray-600 group-hover:stroke-gray-700" />
          {t('Command')}
        </Button>
        <Tooltip
          positionElm={addCommandButtonRef.current}
          text={t('Command_tooltip')}
        />
        <Button
          variant="outline"
          className="absolute right-0 translate-x-[-5%] pl-2 pr-2.5 w-32 rounded-md transition hover:bg-gray-100 hover:scale-[110%] group"
          asChild
        >
          <a
            href={`${HUB_URL}/?utm_source=optionPage&utm_medium=button`}
            target="_blank"
            className="font-mono text-gray-600 hover:text-gray-700"
          >
            <Search />
            <span className="font-semibold">Command</span>
            <span className="font-thin">Hub</span>
          </a>
        </Button>
        <CommandEditDialog
          open={commandDialogOpen}
          onOpenChange={setCommandDialogOpen}
          onSubmit={(command) => commandUpsert(command)}
          folders={folderArray.fields}
          command={editDataRef.current as SelectionCommand}
        />
        <FolderEditDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          onSubmit={(folder) => commandUpsert(folder)}
          folder={editDataRef.current as CommandFolder}
          folders={folderArray.fields}
        />
      </div>
      <ul ref={commandsRef}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={flatten}
            strategy={verticalListSortingStrategy}
          >
            {flatten.map((field, index) => (
              <SortableItem
                key={field.id}
                id={field.id}
                index={index}
                level={calcLevel(field, folderArray.fields)}
                droppable={isDroppable(field, activeNode, folderArray.fields)}
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
                        isFolder(field.content)
                          ? field.content.iconSvg
                          : undefined
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
                        onClick={(title) => commandCopy(index, title)}
                      />
                    )}
                    <EditButton onClick={() => commandEditorOpen(index)} />
                    <RemoveButton
                      title={field.content.title}
                      iconUrl={field.content.iconUrl}
                      iconSvg={
                        isFolder(field.content)
                          ? field.content.iconSvg
                          : undefined
                      }
                      onRemove={() => commandRemove(index)}
                    />
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </ul>
    </>
  )
}
