import { useState, useEffect } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Plus,
  Trash2,
  Save,
  SquareTerminal,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
} from "@/components/ui/dialog"

import {
  FormControl,
  FormMessage,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { Input } from "@/components/ui/input"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { InputField } from "@/components/option/field/InputField"
import { IconField } from "@/components/option/field/IconField"
import { SelectField } from "@/components/option/field/SelectField"
import { TextareaField } from "@/components/option/field/TextareaField"
import { PageActionSection } from "@/components/option/editor/PageActionSection"
import { PaeActionHelp } from "@/components/help/PageActionHelp"
import { PageActionStep } from "@/types/schema"

import {
  OPEN_MODE,
  SPACE_ENCODING,
  POPUP_OPTION,
  COPY_OPTION,
  ROOT_FOLDER,
  PAGE_ACTION_OPEN_MODE,
  ICON_NOT_FOUND,
  SCREEN,
} from "@/const"

import {
  FaviconContextProvider,
  useFavicon,
  FaviconEvent,
} from "@/hooks/option/useFavicon"
import { usePrevious } from "@/hooks/usePrevious"

import { Ipc, BgCommand } from "@/services/ipc"
import { getScreenSize } from "@/services/screen"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"
import { ANALYTICS_EVENTS, sendEvent } from "@/services/analytics"

import { isEmpty, e2a, cn } from "@/lib/utils"
import { t as _t } from "@/services/i18n"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

import {
  SEARCH_OPEN_MODE,
  isSearchType,
  commandSchema,
  CommandSchemaType,
} from "@/types/schema"
import type {
  SelectionCommand,
  CommandFolder,
  PageActionRecordingData,
} from "@/types"

import css from "./CommandEditDialog.module.css"
import { calcLevel } from "@/services/option/commandTree"

const EmptyFolder = {
  id: ROOT_FOLDER,
  title: t("Command_rootFolder"),
} as CommandFolder

const getDefault = (openMode: OPEN_MODE, base?: CommandSchemaType) => {
  if (SEARCH_OPEN_MODE.includes(openMode as any)) {
    let searchUrl = ""
    if (base && (base as any).pageActionOption?.startUrl) {
      searchUrl = (base as any).pageActionOption.startUrl
    }
    return {
      ...base,
      searchUrl,
      openMode: OPEN_MODE.POPUP as const,
      openModeSecondary: OPEN_MODE.TAB as const,
      spaceEncoding: SPACE_ENCODING.PLUS,
      parentFolderId: ROOT_FOLDER,
      popupOption: {
        width: POPUP_OPTION.width,
        height: POPUP_OPTION.height,
      },
    }
  }
  if (openMode === OPEN_MODE.API) {
    return {
      ...base,
      openMode: OPEN_MODE.API as const,
      fetchOptions: "",
      variables: [],
      parentFolderId: ROOT_FOLDER,
    }
  }
  if (openMode === OPEN_MODE.PAGE_ACTION) {
    let startUrl = ""
    if (base && (base as any).searchUrl) {
      startUrl = (base as any).searchUrl
    }
    return {
      ...base,
      openMode: OPEN_MODE.PAGE_ACTION as const,
      parentFolderId: ROOT_FOLDER,
      popupOption: {
        width: POPUP_OPTION.width + 100,
        height: POPUP_OPTION.height + 50,
      },
      pageActionOption: {
        startUrl,
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        steps: [],
      },
    }
  }
  if (openMode === OPEN_MODE.LINK_POPUP) {
    return {
      ...base,
      title: "Link Popup",
      iconUrl:
        "https://cdn3.iconfinder.com/data/icons/fluent-regular-24px-vol-5/24/ic_fluent_open_24_regular-1024.png",
      openMode: OPEN_MODE.LINK_POPUP as const,
      parentFolderId: ROOT_FOLDER,
      popupOption: {
        width: POPUP_OPTION.width,
        height: POPUP_OPTION.height,
      },
    }
  }
  if (openMode === OPEN_MODE.COPY) {
    return {
      ...base,
      title: "Copy text",
      iconUrl:
        "https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png",
      openMode: OPEN_MODE.COPY as const,
      copyOption: COPY_OPTION.DEFAULT,
      parentFolderId: ROOT_FOLDER,
    }
  }
  if (openMode === OPEN_MODE.GET_TEXT_STYLES) {
    return {
      ...base,
      title: "Get Text Styles",
      iconUrl:
        "https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png",
      openMode: OPEN_MODE.GET_TEXT_STYLES as const,
      parentFolderId: ROOT_FOLDER,
    }
  }
}

const DEFAULT_MODE = OPEN_MODE.POPUP

const InitialValues = getDefault(DEFAULT_MODE, {
  id: "",
  title: "",
} as CommandSchemaType)

type CommandEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (command: SelectionCommand) => void
  folders: CommandFolder[]
  command?: SelectionCommand
}

export const CommandEditDialog = ({
  open,
  onOpenChange,
  onSubmit,
  folders,
  command,
}: CommandEditDialogProps) => {
  return (
    <FaviconContextProvider>
      <CommandEditDialogInner
        open={open}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        folders={folders}
        command={command}
      />
    </FaviconContextProvider>
  )
}

const CommandEditDialogInner = ({
  open,
  onOpenChange,
  onSubmit,
  folders,
  command,
}: CommandEditDialogProps) => {
  const [initialized, setInitialized] = useState(false)

  const form = useForm<CommandSchemaType>({
    resolver: zodResolver(commandSchema),
    mode: "onChange",
    defaultValues: InitialValues,
  })
  const { register, reset, getValues, setValue, clearErrors } = form
  const { setIconUrlSrc, subscribe, unsubscribe } = useFavicon()

  const isUpdate = command != null

  const variableArray = useFieldArray({
    name: "variables",
    control: form.control,
    keyName: "_id",
  })

  const openMode = useWatch({
    control: form.control,
    name: "openMode",
    defaultValue: DEFAULT_MODE,
  })
  const preOpenMode = usePrevious(openMode)

  const searchUrl = useWatch({
    control: form.control,
    name: "searchUrl",
    defaultValue: "",
  })

  const startUrl = useWatch({
    control: form.control,
    name: "pageActionOption.startUrl",
    defaultValue: "",
  })

  const iconUrl = useWatch({
    control: form.control,
    name: "iconUrl",
    defaultValue: "",
  })

  const iconUrlSrc = searchUrl || startUrl

  const openPageActionRecorder = async () => {
    await Storage.set<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      {
        startUrl,
        openMode: getValues("pageActionOption.openMode"),
        size: getValues("popupOption") ?? POPUP_OPTION,
        steps: getValues("pageActionOption.steps"),
      },
    )
    await Ipc.send(BgCommand.startPageActionRecorder, {
      startUrl,
      openMode: getValues("pageActionOption.openMode"),
      size: getValues("popupOption") ?? POPUP_OPTION,
      screen: await getScreenSize(),
    })
    sendEvent(
      ANALYTICS_EVENTS.OPEN_DIALOG,
      {
        event_label: "pageAction_recorder",
      },
      SCREEN.OPTION,
    )
  }

  useEffect(() => {
    if (command != null) {
      if (isEmpty(command.parentFolderId)) {
        command.parentFolderId = ROOT_FOLDER
      }
      reset((command as any) ?? InitialValues)
    } else {
      setTimeout(() => {
        reset(InitialValues)
      }, 100)
    }
  }, [command, reset])

  useEffect(() => {
    if (openMode === preOpenMode) return
    if (openMode === command?.openMode) return
    if (
      SEARCH_OPEN_MODE.includes(openMode as any) &&
      SEARCH_OPEN_MODE.includes(preOpenMode as any)
    ) {
      return
    }
    reset(getDefault(openMode, getValues()))
  }, [command?.openMode, preOpenMode, openMode, reset, getValues])

  useEffect(() => {
    if (!initialized) return
    if (!isEmpty(iconUrl)) return // already set
    setIconUrlSrc(iconUrlSrc)
  }, [initialized, iconUrl, iconUrlSrc, setIconUrlSrc])

  useEffect(() => {
    if (!open) setIconUrlSrc("")
    setTimeout(() => {
      setInitialized(open)
    }, 100)
  }, [open, setIconUrlSrc])

  useEffect(() => {
    Storage.addListener<PageActionRecordingData>(
      SESSION_STORAGE_KEY.PA_RECORDING,
      ({ size, steps }) => {
        if (steps == null) return
        setValue("popupOption", size)
        setValue("pageActionOption.steps", steps as PageActionStep[])
      },
    )
  }, [setValue])

  useEffect(() => {
    const sub = (e: any) => {
      if (e.type === FaviconEvent.FAIL) {
        setValue("iconUrl", ICON_NOT_FOUND)
      } else {
        setValue("iconUrl", e.detail.faviconUrl)
      }
      clearErrors("iconUrl")
    }

    subscribe(FaviconEvent.START, sub)
    subscribe(FaviconEvent.SUCCESS, sub)
    subscribe(FaviconEvent.FAIL, sub)
    return () => {
      unsubscribe(FaviconEvent.START, sub)
      unsubscribe(FaviconEvent.SUCCESS, sub)
      unsubscribe(FaviconEvent.FAIL, sub)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="relative">
            <DialogTitle>
              <SquareTerminal />
              {t("Command_edit")}
            </DialogTitle>
            {openMode === OPEN_MODE.PAGE_ACTION && (
              <PaeActionHelp className="absolute -top-4 right-2" />
            )}
          </DialogHeader>
          <DialogDescription>{t("Command_input")}</DialogDescription>
          <Form {...form}>
            <div id="CommandEditForm" className="space-y-2">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <input
                        {...register("id", { value: field.value })}
                        type="hidden"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <InputField
                control={form.control}
                name="title"
                formLabel={t("title")}
                inputProps={{
                  type: "string",
                  ...register("title", {}),
                }}
              />

              <SelectField
                control={form.control}
                name="openMode"
                formLabel="Open Mode"
                options={e2a(OPEN_MODE)
                  .filter(
                    (mode) =>
                      mode !== OPEN_MODE.ADD_PAGE_RULE &&
                      mode !== OPEN_MODE.OPTION,
                  )
                  .map((mode) => ({
                    name: t(`openMode_${mode}`),
                    value: mode,
                  }))}
              />

              {SEARCH_OPEN_MODE.includes(openMode as any) && (
                <SelectField
                  control={form.control}
                  name="openModeSecondary"
                  formLabel={t("openModeSecondary")}
                  options={SEARCH_OPEN_MODE.map((mode) => ({
                    name: t(`openMode_${mode}`),
                    value: mode,
                  }))}
                />
              )}

              {(SEARCH_OPEN_MODE.includes(openMode as any) ||
                openMode === OPEN_MODE.API) && (
                <InputField
                  control={form.control}
                  name="searchUrl"
                  formLabel={t("searchUrl")}
                  inputProps={{
                    type: "string",
                    ...register("searchUrl", {}),
                  }}
                  description={
                    openMode === OPEN_MODE.API
                      ? t("searchUrl_desc_api")
                      : t("searchUrl_desc")
                  }
                  previewUrl={
                    !isEmpty(getValues("searchUrl"))
                      ? getValues("iconUrl")
                      : undefined
                  }
                />
              )}

              {openMode === OPEN_MODE.PAGE_ACTION && (
                <PageActionSection
                  form={form}
                  openRecorder={openPageActionRecorder}
                />
              )}

              {openMode === OPEN_MODE.API && (
                <>
                  <TextareaField
                    control={form.control}
                    name="fetchOptions"
                    formLabel={t("fetchOptions")}
                    className="font-mono text-xs sm:text-xs lg:text-sm"
                  />
                  <FormField
                    control={form.control}
                    name="variables"
                    render={() => (
                      <FormItem className="flex items-center">
                        <div className="w-2/6">
                          <FormLabel>{t("variables")}</FormLabel>
                        </div>
                        <div className="w-4/6">
                          <FormControl>
                            <ul className="">
                              {variableArray.fields.map((field, index) => (
                                <li
                                  key={field._id}
                                  className="flex items-center gap-2 p-1"
                                >
                                  <FormField
                                    control={form.control}
                                    name={`variables.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-1 w-1/2">
                                        <FormLabel className="text-xs text-right">
                                          {t("variableName")}
                                        </FormLabel>
                                        <FormControl className="flex-1">
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`variables.${index}.value`}
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-1 w-1/2">
                                        <FormLabel className="text-xs text-right">
                                          {t("variableValue")}
                                        </FormLabel>
                                        <FormControl>
                                          <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <button
                                    type="button"
                                    className="group transition p-1.5 flex-none rounded-lg hover:bg-red-200 hover:scale-[1.1]"
                                    onClick={() => variableArray.remove(index)}
                                  >
                                    <Trash2
                                      className="stroke-gray-500 group-hover:stroke-red-500"
                                      size={16}
                                    />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </FormControl>
                          <Button
                            type="button"
                            variant="secondary"
                            className="relative mt-1 rounded-lg h-7 left-[50%] translate-x-[-50%]"
                            onClick={() =>
                              variableArray.append({
                                name: "",
                                value: "",
                              })
                            }
                          >
                            <Plus />
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {openMode === OPEN_MODE.COPY && (
                <SelectField
                  control={form.control}
                  name="copyOption"
                  formLabel={t("copyOption")}
                  options={e2a(COPY_OPTION).map((opt) => ({
                    name: t(`copyOption_${opt}`),
                    value: opt,
                  }))}
                />
              )}

              {/* details */}

              <Collapsible
                className={cn(css.collapse, "flex flex-col items-end")}
              >
                <CollapsibleTrigger className="flex items-center hover:bg-gray-200 p-2 py-1.5 rounded-lg text-sm">
                  <ChevronsUpDown
                    size={18}
                    className={cn(css.icon, css.iconUpDown)}
                  />
                  <ChevronsDownUp
                    size={18}
                    className={cn(css.icon, css.iconDownUp)}
                  />
                  <span className="ml-0.5">{t("labelDetail")}</span>
                </CollapsibleTrigger>
                <CollapsibleContent
                  className={cn(
                    css.CollapsibleContent,
                    "w-full space-y-3 pt-2",
                  )}
                >
                  <IconField
                    control={form.control}
                    nameUrl="iconUrl"
                    nameSvg="iconSvg"
                    formLabel={t("iconUrl")}
                    description={
                      SEARCH_OPEN_MODE.includes(openMode as any) ||
                      openMode === OPEN_MODE.API
                        ? t("iconUrl_desc")
                        : openMode === OPEN_MODE.PAGE_ACTION
                          ? t("iconUrl_desc_pageAction")
                          : ""
                    }
                  />

                  {SEARCH_OPEN_MODE.includes(openMode as any) && (
                    <SelectField
                      control={form.control}
                      name="spaceEncoding"
                      formLabel={t("spaceEncoding")}
                      options={e2a(SPACE_ENCODING).map((enc) => ({
                        name: t(`spaceEncoding_${enc}`),
                        value: enc,
                      }))}
                      description={t("spaceEncoding_desc")}
                    />
                  )}

                  <SelectField
                    control={form.control}
                    name="parentFolderId"
                    formLabel={t("parentFolderId")}
                    options={[EmptyFolder, ...folders].map((folder) => ({
                      name: folder.title,
                      value: folder.id,
                      iconUrl: folder.iconUrl,
                      iconSvg: folder.iconSvg,
                      level: calcLevel(folder, folders),
                    }))}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Form>
          <DialogFooter className="pt-0">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="lg">
                {t("labelCancel")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              size="lg"
              onClick={form.handleSubmit(
                (data) => {
                  if (isEmpty(data.id)) data.id = crypto.randomUUID()
                  if (data.revision == null) data.revision = 0
                  if (data.parentFolderId === ROOT_FOLDER) {
                    data.parentFolderId = undefined
                  }
                  if (isSearchType(data)) {
                    if (data.popupOption != null) {
                      data.popupOption = {
                        width: Number(data.popupOption.width),
                        height: Number(data.popupOption.height),
                      }
                    }
                  }
                  onSubmit(data)
                  onOpenChange(false)
                  reset(InitialValues)
                },
                (err) => console.error(err),
              )}
            >
              <Save />
              {isUpdate ? t("labelUpdate") : t("labelSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
