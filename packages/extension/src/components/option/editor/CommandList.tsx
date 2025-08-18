import { useState, useRef, useEffect } from "react"
import { useFieldArray } from "react-hook-form"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from "@dnd-kit/core"

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import { CommandEditDialog } from "@/components/option/editor/CommandEditDialog"
import { FolderEditDialog } from "@/components/option/editor/FolderEditDialog"
import {
  CommandSchemaType,
  CommandsSchemaType,
  FoldersSchemaType,
} from "@/types/schema"

import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"
import { SCREEN } from "@/const"
import type { Command, CommandFolder, SelectionCommand } from "@/types"

// Imported services and hooks
import {
  toCommandTree,
  toFlatten,
  type FlattenNode,
} from "@/services/option/commandTree"
import {
  isCommand,
  isFolder,
  getDescendantFolderIds,
} from "@/services/option/commandUtils"
import { isValidDrop } from "@/services/option/dragAndDrop"
import { useCommandActions } from "@/hooks/option/useCommandActions"
import { useCommandDragDrop } from "@/hooks/option/useCommandDragDrop"
import { CommandListMenu } from "./CommandListMenu"
import { CommandTreeRenderer } from "./CommandTreeRenderer"

// Drag filtering utilities

/**
 * Determines if a node is a descendant of any folder in the hidden folder set.
 * Used during drag operations to filter out items that should not be visible
 * when their parent folder is being dragged.
 *
 * @param node - The tree node to check
 * @param hiddenFolderIds - Set of folder IDs that are currently hidden (being dragged)
 * @returns true if the node belongs to any of the hidden folders
 */
const isDescendantOfHiddenFolder = (
  node: FlattenNode,
  hiddenFolderIds: Set<string>,
): boolean => {
  if (isCommand(node.content) || isFolder(node.content)) {
    return !!(
      node.content.parentFolderId &&
      hiddenFolderIds.has(node.content.parentFolderId)
    )
  }
  return false
}

function commandsFilter(
  nodes: FlattenNode[],
  draggingId?: string | null,
  folders: CommandFolder[] = [],
): FlattenNode[] {
  if (!draggingId) return nodes
  const draggingNode = nodes.find((n) => n.id === draggingId)
  if (isCommand(draggingNode?.content)) {
    return nodes
  }
  const descendantFolderIds = getDescendantFolderIds(draggingId, folders)
  const hiddenFolderIds = new Set([draggingId, ...descendantFolderIds])
  return nodes.filter(
    (node) => !isDescendantOfHiddenFolder(node, hiddenFolderIds),
  )
}

function isDroppable(
  selfNode: FlattenNode,
  activeNode?: FlattenNode,
  folders: CommandFolder[] = [],
): boolean {
  if (!activeNode) return true
  return isValidDrop(activeNode.content, selfNode.content, folders)
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

  const commandArray = useFieldArray<CommandsSchemaType, "commands", "_id">({
    name: "commands",
    control: control,
    keyName: "_id",
  })

  const folderArray = useFieldArray<FoldersSchemaType, "folders", "_id">({
    name: "folders",
    control: control,
    keyName: "_id",
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const commandTree = toCommandTree(commandArray.fields, folderArray.fields)
  let flatten = toFlatten(commandTree)
  flatten = commandsFilter(flatten, draggingId, folderArray.fields)
  const activeNode = flatten.find((f) => f.id === draggingId)

  const setCommandDialogOpen = (open: boolean) => {
    if (!open) {
      editDataRef.current = null
    } else {
      sendEvent(
        ANALYTICS_EVENTS.OPEN_DIALOG,
        {
          event_label: "command_edit",
        },
        SCREEN.OPTION,
      )
    }
    _setCommandDialogOpen(open)
  }

  const setFolderDialogOpen = (open: boolean) => {
    if (!open) {
      editDataRef.current = null
    }
    _setFolderDialogOpen(open)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setDraggingId(active.id as string)
  }

  // Initialize command actions and drag drop functionality
  const commandActions = useCommandActions(
    commandArray,
    folderArray,
    commandTree,
  )

  const { handleDragEnd } = useCommandDragDrop(
    commandActions,
    commandArray.fields,
    folderArray.fields,
  )

  const handleDragEndWithReset = (event: any) => {
    setDraggingId(null)
    handleDragEnd(event)
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
      commandActions.commandRemove(node.id)
    }
  }

  useEffect(() => {
    commandsRef.current?.style.setProperty(
      "height",
      commandsRef.current.scrollHeight + "px",
    )
  }, [commandArray.fields, folderArray.fields])

  return (
    <>
      <CommandListMenu
        onAddCommand={() => setCommandDialogOpen(true)}
        onAddFolder={() => setFolderDialogOpen(true)}
        addCommandButtonRef={addCommandButtonRef}
        addFolderButtonRef={addFolderButtonRef}
        commandCount={commandArray.fields.length}
      />
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
      <ul ref={commandsRef}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEndWithReset}
        >
          <SortableContext
            items={flatten}
            strategy={verticalListSortingStrategy}
          >
            <CommandTreeRenderer
              nodes={flatten}
              folders={folderArray.fields}
              activeNode={activeNode}
              onEdit={commandEditorOpen}
              onRemove={commandRemove}
              onCopy={commandCopy}
              isDroppable={(node, activeNode) =>
                isDroppable(node, activeNode, folderArray.fields)
              }
            />
          </SortableContext>
        </DndContext>
      </ul>
    </>
  )
}
