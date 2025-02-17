import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { Trash2, Pencil } from 'lucide-react'

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

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { Tooltip } from '@/components/Tooltip'
import { SortableItem } from '@/components/option/SortableItem'
import { LoadingIcon } from '@/components/option/LoadingIcon'

import { t as _t } from '@/services/i18n'
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import { z } from 'zod'
import {
  STYLE,
  OPEN_MODE,
  STARTUP_METHOD,
  POPUP_PLACEMENT,
  KEYBOARD,
  SPACE_ENCODING,
  COMMAND_MAX,
  DRAG_OPEN_MODE,
  POPUP_ENABLED,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  STYLE_VARIABLE,
} from '@/const'
import type { SettingsType, Command, CommandFolder } from '@/types'
import {
  isMenuCommand,
  isLinkCommand,
  isMac,
  sleep,
  unique,
  e2a,
} from '@/lib/utils'
import { Settings } from '@/services/settings'

function hyphen2Underscore(input: string): string {
  return input.replace(/-/g, '_')
}

const formSchema = z
  .object({
    startupMethod: z
      .object({
        method: z.nativeEnum(STARTUP_METHOD),
        keyboardParam: z.nativeEnum(KEYBOARD).optional(),
        leftClickHoldParam: z.number().min(50).max(500).step(10).optional(),
      })
      .strict(),
    popupPlacement: z.nativeEnum(POPUP_PLACEMENT),
    style: z.nativeEnum(STYLE),
    commands: z
      .array(
        z
          .object({
            id: z.string(),
            title: z.string(),
            iconUrl: z.string(),
            searchUrl: z.string(),
            openMode: z.nativeEnum(OPEN_MODE).or(z.nativeEnum(DRAG_OPEN_MODE)),
            parentFolderId: z.string().optional(),
            spaceEncoding: z.nativeEnum(SPACE_ENCODING).optional(),
            popupOption: z
              .object({
                width: z.number().min(1),
                height: z.number().min(1),
              })
              .optional(),
            fetchOptions: z.string().optional(),
            variables: z
              .array(
                z.object({
                  name: z.string(),
                  value: z.string(),
                }),
              )
              .optional(),
            copyOption: z.enum(['default', 'text']).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(COMMAND_MAX),
    folders: z
      .array(
        z
          .object({
            id: z.string(),
            title: z.string(),
            iconUrl: z.string().optional(),
            onlyIcon: z.boolean().optional(),
          })
          .strict(),
      )
      .optional(),
    linkCommand: z
      .object({
        enabled: z
          .nativeEnum(LINK_COMMAND_ENABLED)
          .refine((v) => v !== LINK_COMMAND_ENABLED.INHERIT),
        openMode: z.nativeEnum(DRAG_OPEN_MODE),
        showIndicator: z.boolean(),
        startupMethod: z
          .object({
            method: z.nativeEnum(LINK_COMMAND_STARTUP_METHOD),
            keyboardParam: z.string().optional(),
            threshold: z.number().min(50).max(400).step(10).optional(),
            leftClickHoldParam: z.number().min(50).max(500).step(10).optional(),
          })
          .strict(),
      })
      .strict(),
    pageRules: z
      .array(
        z
          .object({
            urlPattern: z.string(),
            popupEnabled: z.nativeEnum(POPUP_ENABLED),
            popupPlacement: z.nativeEnum(POPUP_PLACEMENT),
            linkCommandEnabled: z.nativeEnum(LINK_COMMAND_ENABLED),
          })
          .strict(),
      )
      .optional(),
    userStyles: z
      .array(
        z
          .object({
            name: z.nativeEnum(STYLE_VARIABLE),
            value: z.string(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict()

type FormValues = z.infer<typeof formSchema>

type CommandTreeNode = {
  type: 'command' | 'folder'
  content: Command | CommandFolder
  children?: CommandTreeNode[]
}

function toCommandTree(
  commands: Command[],
  folders: CommandFolder[],
): CommandTreeNode[] {
  let tree = commands.reduce((acc, command) => {
    if (command.parentFolderId) {
      const folder = folders.find((f) => f.id === command.parentFolderId)
      if (folder) {
        const parent = acc.find((node) => node.content.id === folder.id)
        if (parent) {
          if (parent.children == null) parent.children = []
          parent.children.push({
            type: 'command',
            content: command,
          })
        } else {
          acc.push({
            type: 'folder',
            content: folder,
            children: [
              {
                type: 'command',
                content: command,
              },
            ],
          })
        }
      }
    } else {
      acc.push({
        type: 'command',
        content: command,
      })
    }
    return acc
  }, [] as CommandTreeNode[])
  const existsFolders = unique(commands.map((c) => c.parentFolderId))
  const remainingFolders = folders.filter((f) => !existsFolders.includes(f.id))
  tree = tree.concat(
    remainingFolders.map((folder) => ({
      type: 'folder',
      content: folder,
      children: [],
    })),
  )
  return tree
}

type FlattenNode = {
  id: string
  content: Command | CommandFolder
}

function toFlatten(
  tree: CommandTreeNode[],
  flatten: FlattenNode[] = [],
): FlattenNode[] {
  for (const node of tree) {
    if (node.type === 'command') {
      flatten.push({
        id: `${node.content.id}`,
        content: node.content,
      })
    } else {
      flatten.push({
        id: `${node.content.id}`,
        content: node.content,
      })
      toFlatten(node.children ?? [], flatten)
      delete node.children
    }
  }
  return flatten
}

function nodeFilter(
  draggingId: string | null,
  node: FlattenNode,
  nodes: FlattenNode[],
): boolean {
  const active = nodes.find((n) => n.id === draggingId)
  if (!active) return true
  if (isCommand(active.content)) return true
  if (!isCommand(node.content)) return true
  if (node.content.parentFolderId != null) return false
  return true
}

function isCommand(content: Command | CommandFolder): content is Command {
  return 'openMode' in content
}

function calcLevel(node: FlattenNode): number {
  if (isCommand(node.content)) {
    if (node.content.parentFolderId) {
      return 1
    } else {
      return 0
    }
  } else {
    return 0
  }
}

export function SettingForm() {
  const [settingData, setSettingData] = useState<SettingsType | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const initializedRef = useRef<boolean>(false)
  const saveToRef = useRef<number>()
  const iconToRef = useRef<number>()
  const commandsRef = useRef<HTMLUListElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  })
  const { reset, getValues, register } = form
  const commandArray = useFieldArray({
    name: 'commands',
    control: form.control,
    keyName: '_id',
  })
  const folderArray = useFieldArray({
    name: 'folders',
    control: form.control,
    keyName: '_id',
  })
  const commandTree = toCommandTree(commandArray.fields, folderArray.fields)
  let flatten = toFlatten(commandTree)
  flatten = flatten.filter((f) => nodeFilter(draggingId, f, flatten))

  const updateSettings = async (settings: SettingsType) => {
    if (isSaving) return
    try {
      setIsSaving(true)
      const current = await Settings.get(true)
      const linkCommands = current.commands.filter(isLinkCommand).map((c) => ({
        ...c,
        openMode: settings.linkCommand.openMode,
      }))

      // sort commands
      const commandTree = toCommandTree(settings.commands, settings.folders)
      const commands = toFlatten(commandTree)
        .map((f) => f.content)
        .filter((c) => isCommand(c))

      settings.commands = [...commands, ...linkCommands]
      await Settings.set(settings)
      await sleep(1000)
    } catch (e) {
      console.error('Failed to update settings!', settings)
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await Settings.get(true)
      // Convert linkCommand option
      const linkCommands = settings.commands.filter(isLinkCommand)
      if (linkCommands.length > 0) {
        const linkCommand = linkCommands[0]
        settings.linkCommand = {
          ...settings.linkCommand,
          openMode: linkCommand.openMode,
        }
      }
      settings.commands = settings.commands.filter(isMenuCommand)
      setSettingData(settings)
      reset(settings)
    }
    loadSettings()
  }, [])

  // Save after 500 ms to storage.
  useEffect(() => {
    let unmounted = false

    // Skip saving if the settingData is not initialized.
    if (!initializedRef.current) {
      initializedRef.current = settingData != null
      return
    }

    clearTimeout(saveToRef.current)
    saveToRef.current = window.setTimeout(() => {
      if (unmounted || settingData == null) return
      updateSettings(settingData)
    }, 1 * 500 /* ms */)

    return () => {
      unmounted = true
      clearTimeout(saveToRef.current)
      clearTimeout(iconToRef.current)
    }
  }, [settingData])

  useEffect(() => {
    commandsRef.current?.style.setProperty(
      'height',
      commandsRef.current.scrollHeight + 'px',
    )
  }, [settingData?.commands])

  const handleSubmit = (
    data: FormValues,
    e: React.BaseSyntheticEvent | undefined,
  ) => {
    console.log(data, e)
    // Remove unnecessary fields when openMode is not popup or tab or window.
    //if (id?.endsWith('openMode')) {
    //  data.commands
    //    .filter(
    //      (c) =>
    //        c.openMode !== OPEN_MODE.POPUP &&
    //        c.openMode !== OPEN_MODE.WINDOW &&
    //        c.openMode !== OPEN_MODE.TAB,
    //    )
    //    .map((c) => {
    //      delete c.openModeSecondary
    //      delete c.spaceEncoding
    //    })
    //  data.commands
    //    .filter(
    //      (c) =>
    //        c.openMode !== OPEN_MODE.POPUP &&
    //        c.openMode !== OPEN_MODE.WINDOW &&
    //        c.openMode !== OPEN_MODE.LINK_POPUP,
    //    )
    //    .map((c) => {
    //      delete c.popupOption
    //    })
    //}

    //// If popup-delay is not set
    //// when the keyInput or leftClickHold is selected, set 0 ms.
    //if (id?.endsWith('method')) {
    //  if (
    //    data.startupMethod.method === STARTUP_METHOD.KEYBOARD ||
    //    data.startupMethod.method === STARTUP_METHOD.LEFT_CLICK_HOLD
    //  ) {
    //    let userStyles = data.userStyles
    //    if (!userStyles.find((s) => s.name === STYLE_VARIABLE.POPUP_DELAY)) {
    //      userStyles.push({ name: STYLE_VARIABLE.POPUP_DELAY, value: '0' })
    //    }
    //    updateSettingData({
    //      ...data,
    //      userStyles,
    //    })
    //    return
    //  }
    //}

    //// Update iconURL when searchUrl chagned and iconUrl is empty.
    //if (id?.endsWith('searchUrl')) {
    //  const command = data.commands[toCommandId(id)]
    //  if (!isEmpty(command.searchUrl) && isEmpty(command.iconUrl)) {
    //    clearTimeout(iconToRef.current)
    //    iconToRef.current = window.setTimeout(() => {
    //      sendMessage(OPTION_MSG.FETCH_ICON_URL, {
    //        searchUrl: command.searchUrl,
    //        settings: data,
    //      })
    //    }, 500)
    //  }
    //}

    //updateSettingData(data)
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setDraggingId(active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null)
    const { active, over } = event
    if (!active || !over) return
    if (active.id !== over?.id) {
      moveArray(`${active.id}`, `${over.id}`)
    }
  }

  const moveArray = (srcId: string, distId: string) => {
    const srcNode = flatten.find((f) => f.id === srcId)
    const distNode = flatten.find((f) => f.id === distId)
    const isMoveDown =
      flatten.findIndex((f) => f.id === srcId) <
      flatten.findIndex((f) => f.id === distId)
    if (!srcNode || !distNode) return

    if (isCommand(srcNode.content)) {
      const srcIdx = commandArray.fields.findIndex((f) => f.id === srcId)
      if (isCommand(distNode.content)) {
        // command to command
        const distIdx = commandArray.fields.findIndex((f) => f.id === distId)
        commandArray.update(srcIdx, {
          ...srcNode.content,
          parentFolderId: distNode.content.parentFolderId,
        })
        commandArray.move(srcIdx, distIdx)
      } else {
        // command to folder
        const distIdx = commandArray.fields.findIndex(
          (f) => f.parentFolderId === distId,
        )
        commandArray.update(srcIdx, {
          ...srcNode.content,
          parentFolderId: isMoveDown ? distId : undefined,
        })
        commandArray.move(srcIdx, isMoveDown ? distIdx - 1 : distIdx)
      }
    } else if (!isCommand(srcNode.content)) {
      const srcIdx = commandArray.fields.findIndex(
        (f) => f.parentFolderId === srcId,
      )
      if (isCommand(distNode.content)) {
        // folder to command
        const distIdx = commandArray.fields.findIndex((f) => f.id === distId)
        commandArray.move(srcIdx, distIdx)
      } else {
        // folder to folder
        const distIdx = commandArray.fields.findIndex(
          (f) => f.parentFolderId === distId,
        )
        commandArray.move(srcIdx, distIdx)
      }
    }
  }

  const os = isMac() ? 'mac' : 'windows'

  return (
    <Form {...form}>
      <CSSTransition
        in={isSaving}
        timeout={300}
        classNames="drop-in"
        unmountOnExit
        nodeRef={loadingRef}
      >
        <LoadingIcon ref={loadingRef}>
          <span>{_t('saving')}</span>
        </LoadingIcon>
      </CSSTransition>

      <form
        id="InputForm"
        className="space-y-10 w-[600px] mx-auto"
        onChange={form.handleSubmit(handleSubmit)}
      >
        <section className="space-y-3">
          <h3 className="text-xl font-semibold">起動方法</h3>
          <p className="text-base">
            ポップアップメニューを表示する方法を変更します。
          </p>
          <SelectField
            control={form.control}
            name="startupMethod.method"
            formLabel="方法"
            options={e2a(STARTUP_METHOD).map((method) => ({
              name: t(`startupMethod_${method}`),
              value: method,
            }))}
          />
          {getValues('startupMethod.method') === STARTUP_METHOD.KEYBOARD && (
            <SelectField
              control={form.control}
              name="startupMethod.keyboardParam"
              formLabel="表示を切り替えるキー"
              options={e2a(KEYBOARD)
                .filter((k) => k != KEYBOARD.META)
                .map((key) => ({
                  name: t(`keyboardParam_${key}_${os}`),
                  value: key,
                }))}
            />
          )}
          {getValues('startupMethod.method') ===
            STARTUP_METHOD.LEFT_CLICK_HOLD && (
            <InputField
              control={form.control}
              name="startupMethod.leftClickHoldParam"
              formLabel="長押し時間(ms)"
              inputProps={{
                type: 'number',
                min: 50,
                max: 500,
                step: 10,
                ...register('startupMethod.leftClickHoldParam', {
                  valueAsNumber: true,
                }),
              }}
            />
          )}
          <SelectField
            control={form.control}
            name="popupPlacement"
            formLabel="メニュー表示位置"
            options={e2a(POPUP_PLACEMENT).map((placement) => ({
              name: t(`popupPlacement_${hyphen2Underscore(placement)}`),
              value: placement,
            }))}
          />
          <SelectField
            control={form.control}
            name="style"
            formLabel="メニュースタイル"
            options={e2a(STYLE).map((style) => ({
              name: t(`style_${style}`),
              value: style,
            }))}
          />
        </section>
        <section className="space-y-3">
          <h3 className="text-xl font-semibold">コマンド</h3>
          <p className="text-base">
            {t('commands_desc')}
            <br />
            {getValues('commands')?.length ?? 0}
            {t('commands_desc_count')}
          </p>
          <ul className="border-y" ref={commandsRef}>
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
                    level={calcLevel(field)}
                  >
                    <div className="h-14 pr-2 pl-0 flex-1 flex items-center">
                      <div className="flex-1 flex items-center overflow-hidden pr-2">
                        <img
                          src={field.content.iconUrl}
                          alt={field.content.title}
                          className="inline-block w-7 h-7 mr-3"
                        />
                        <div>
                          <p className="text-lg flex flex-row">
                            <span className="text-base">
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
                        <CummandEditButton />
                        {isCommand(field.content) && (
                          <CummandRemoveButton
                            command={field.content}
                            onRemove={() => commandArray.remove(index)}
                          />
                        )}
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </ul>
        </section>
      </form>
    </Form>
  )
}

type SelectOptionType = {
  name: string
  value: string
}

type SelectFieldType = {
  control: any
  name: string
  formLabel: string
  options: SelectOptionType[]
}

const SelectField = ({
  control,
  name,
  formLabel,
  options,
}: SelectFieldType) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
          </div>
          <div className="w-4/6">
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Key" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem value={opt.value} key={opt.value}>
                    {opt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

type InputFieldType = {
  control: any
  name: string
  formLabel: string
  inputProps: React.ComponentProps<typeof Input>
}

const InputField = ({
  control,
  name,
  formLabel,
  inputProps,
}: InputFieldType) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-1">
          <div className="w-2/6">
            <FormLabel>{formLabel}</FormLabel>
          </div>
          <div className="w-4/6">
            <FormControl>
              <Input {...field} {...inputProps} />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

const CummandEditButton = () => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={buttonRef}
        className="p-2 rounded-md transition hover:bg-sky-100 hover:scale-125 group"
      >
        <Pencil
          className="stroke-gray-500 group-hover:stroke-sky-500"
          size={16}
        />
      </button>
      <Tooltip positionElm={buttonRef.current} text={'編集'} />
    </>
  )
}

type CummandRemoveButtonProps = {
  command: Command
  onRemove: () => void
}
const CummandRemoveButton = ({
  command,
  onRemove,
}: CummandRemoveButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog>
      <DialogTrigger
        ref={buttonRef}
        className="p-2 rounded-md transition hover:bg-red-100 hover:scale-125 group"
        asChild
      >
        <button>
          <Trash2
            className="stroke-gray-500 group-hover:stroke-red-500"
            size={16}
          />
        </button>
      </DialogTrigger>
      <Tooltip positionElm={buttonRef.current} text={'削除'} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>削除しますか？</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-center">
          <img
            src={command.iconUrl}
            alt={command.title}
            className="inline-block w-6 h-6 mr-2"
          />
          <span className="text-base">{command.title}</span>
        </DialogDescription>
        <DialogFooter>
          <Button onClick={() => onRemove()} variant="destructive">
            削除する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
