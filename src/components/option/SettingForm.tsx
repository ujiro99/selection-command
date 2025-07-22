import { useState, useEffect, useRef } from "react"
import { CSSTransition } from "react-transition-group"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import {
  MessageSquareMore,
  SquareTerminal,
  Eye,
  BookOpen,
  Paintbrush,
} from "lucide-react"

import { Form } from "@/components/ui/form"
import { LoadingIcon } from "@/components/option/LoadingIcon"
import { InputField } from "@/components/option/field/InputField"
import { SelectField } from "@/components/option/field/SelectField"
import { SwitchField } from "@/components/option/field/SwitchField"
import { PopupPlacementField } from "@/components/option/field/PopupPlacementField"
import { commandSchema, folderSchema } from "@/types/schema"
import { CommandList } from "@/components/option/editor/CommandList"
import { toCommandTree, toFlatten } from "@/services/option/commandTree"
import { isCommand, removeUnstoredParam } from "@/services/option/commandUtils"
import {
  PageRuleList,
  pageRuleSchema,
} from "@/components/option/editor/PageRuleList"
import {
  UserStyleList,
  userStyleSchema,
} from "@/components/option/editor/UserStyleList"
import { ShortcutList } from "@/components/option/editor/ShortcutList"
import { ShortcutSettingsSchema } from "@/types/schema"

import { t as _t } from "@/services/i18n"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)
import {
  STYLE,
  STARTUP_METHOD,
  KEYBOARD,
  DRAG_OPEN_MODE,
  LINK_COMMAND_ENABLED,
  LINK_COMMAND_STARTUP_METHOD,
  STYLE_VARIABLE,
} from "@/const"
import type { UserSettings } from "@/types"
import { PopupPlacementSchema } from "@/types/schema"
import {
  isMenuCommand,
  isLinkCommand,
  isMac,
  isEmpty,
  sleep,
  e2a,
  cn,
} from "@/lib/utils"
import { Settings } from "@/services/settings/settings"
import DefaultSettings from "@/services/option/defaultSettings"

const formSchema = z
  .object({
    startupMethod: z
      .object({
        method: z.nativeEnum(STARTUP_METHOD),
        keyboardParam: z.nativeEnum(KEYBOARD).optional(),
        leftClickHoldParam: z
          .number({ message: t("zod_number") })
          .min(50, { message: t("zod_number_min", ["50"]) })
          .max(500, { message: t("zod_number_max", ["500"]) })
          .optional(),
      })
      .strict(),
    popupPlacement: PopupPlacementSchema,
    style: z.nativeEnum(STYLE),
    commands: z.array(commandSchema).min(1),
    folders: z.array(folderSchema),
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
            keyboardParam: z.nativeEnum(KEYBOARD).optional(),
            threshold: z
              .number({ message: t("zod_number") })
              .min(50, { message: t("zod_number_min", ["50"]) })
              .max(400, { message: t("zod_number_max", ["400"]) })
              .optional(),
            leftClickHoldParam: z
              .number({ message: t("zod_number") })
              .min(50, { message: t("zod_number_min", ["50"]) })
              .max(500, { message: t("zod_number_max", ["500"]) })
              .optional(),
          })
          .strict(),
      })
      .strict(),
    pageRules: z.array(pageRuleSchema),
    userStyles: z.array(userStyleSchema),
    shortcuts: ShortcutSettingsSchema,
  })
  .strict()

type FormValues = z.infer<typeof formSchema>
export type SettingsFormType = Omit<UserSettings, "settingVersion">

export function SettingForm({ className }: { className?: string }) {
  const [isSaving, setIsSaving] = useState(false)
  const saveToRef = useRef<number>()
  const isLoadingRef = useRef<boolean>()
  const loadingRef = useRef<HTMLDivElement>(null)
  const os = isMac() ? "mac" : "windows"

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
  })
  const { reset, getValues, setValue, register, subscribe } = form

  const startupMethod = useWatch({
    control: form.control,
    name: "startupMethod.method",
    defaultValue: STARTUP_METHOD.TEXT_SELECTION,
  })

  const linkCommandMethod = useWatch({
    control: form.control,
    name: "linkCommand.startupMethod.method",
    defaultValue: LINK_COMMAND_STARTUP_METHOD.KEYBOARD,
  })

  // Common function to load and transform settings data
  const loadSettingsData = async () => {
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
    return settings as FormValues
  }

  // Update form with latest settings
  const updateFormSettings = async () => {
    isLoadingRef.current = true
    const settings = await loadSettingsData()
    reset(settings)
    await sleep(100)
    isLoadingRef.current = false
  }

  // Initial settings load
  useEffect(() => {
    const initializeSettings = async () => {
      await updateFormSettings()
    }
    initializeSettings()
  }, [])

  // Handle settings synchronization across tabs and windows
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await updateFormSettings()
      }
    }

    const handleSettingsChange = async () => {
      await updateFormSettings()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    Settings.addChangedListener(handleSettingsChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      Settings.removeChangedListener(handleSettingsChange)
    }
  }, [])

  const updateSettings = async (settings: SettingsFormType) => {
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
        .map((f: any) => f.content)
        .filter(isCommand)
        .map(removeUnstoredParam)

      settings.commands = [...commands, ...linkCommands]
      await Settings.set({
        ...current,
        ...settings,
      })
      await sleep(1000)
    } catch (e) {
      console.error("Failed to update settings!", settings)
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePopupPlacementSubmit = async (data: any) => {
    const { side, align, alignOffset, sideOffset } = data
    const popupPlacement = {
      side,
      align,
      sideOffset,
      alignOffset,
    }
    setValue("popupPlacement", popupPlacement)
  }

  // Set default value for startupMethod.
  useEffect(() => {
    if (startupMethod === STARTUP_METHOD.KEYBOARD) {
      const val = getValues("startupMethod.keyboardParam")
      if (isEmpty(val)) {
        setValue("startupMethod.keyboardParam", KEYBOARD.SHIFT)
      }
    } else if (startupMethod === STARTUP_METHOD.LEFT_CLICK_HOLD) {
      const val = getValues("startupMethod.leftClickHoldParam")
      if (val == null || isNaN(val)) {
        setValue("startupMethod.leftClickHoldParam", 200)
      }
    }
    if (
      startupMethod === STARTUP_METHOD.KEYBOARD ||
      startupMethod === STARTUP_METHOD.LEFT_CLICK_HOLD
    ) {
      const userStyles = getValues("userStyles")
      if (userStyles.every((s) => s.name !== STYLE_VARIABLE.POPUP_DELAY)) {
        setValue("userStyles", [
          ...userStyles,
          { name: STYLE_VARIABLE.POPUP_DELAY, value: 0 },
        ])
      }
    }
  }, [startupMethod])

  // Set default value for linkCommand.startupMethod.
  useEffect(() => {
    if (linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.KEYBOARD) {
      const val = getValues("linkCommand.startupMethod.keyboardParam")
      if (isEmpty(val)) {
        setValue(
          "linkCommand.startupMethod.keyboardParam",
          DefaultSettings.linkCommand.startupMethod.keyboardParam,
        )
      }
    } else if (linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.DRAG) {
      const val = getValues("linkCommand.startupMethod.threshold")
      if (val == null || isNaN(val)) {
        setValue(
          "linkCommand.startupMethod.threshold",
          DefaultSettings.linkCommand.startupMethod.threshold,
        )
      }
    } else if (
      linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD
    ) {
      const val = getValues("linkCommand.startupMethod.leftClickHoldParam")
      if (val == null || isNaN(val)) {
        setValue(
          "linkCommand.startupMethod.leftClickHoldParam",
          DefaultSettings.linkCommand.startupMethod.leftClickHoldParam,
        )
      }
    }
  }, [linkCommandMethod])

  useEffect(() => {
    // Save after 500 ms to storage.
    const subscription = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        // Skip saving if the settingData is loaded.
        if (isLoadingRef.current) return

        clearTimeout(saveToRef.current)
        saveToRef.current = window.setTimeout(() => {
          if (values == null) return
          updateSettings(values as SettingsFormType)
        }, 1 * 500 /* ms */)
      },
    })
    return () => {
      clearTimeout(saveToRef.current)
      subscription()
    }
  }, [subscribe])

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
          <span>{_t("saving")}</span>
        </LoadingIcon>
      </CSSTransition>

      <form
        id="InputForm"
        className={cn(
          "space-y-10 w-[600px] mx-auto pb-20 text-gray-700",
          className,
        )}
      >
        <section id="startupMethod" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <MessageSquareMore size={22} className="mr-2 stroke-gray-600" />
            {t("startupMethod")}
          </h3>
          <p className="text-base">{t("startupMethod_desc")}</p>
          <SelectField
            control={form.control}
            name="startupMethod.method"
            formLabel={t("startupMethod_method")}
            options={e2a(STARTUP_METHOD).map((method) => ({
              name: t(`startupMethod_${method}`),
              value: method,
            }))}
          />
          {startupMethod !== STARTUP_METHOD.CONTEXT_MENU && (
            <SelectField
              control={form.control}
              name="style"
              formLabel={t("style")}
              options={e2a(STYLE).map((style) => ({
                name: t(`style_${style}`),
                value: style,
              }))}
            />
          )}
          {startupMethod === STARTUP_METHOD.KEYBOARD && (
            <SelectField
              control={form.control}
              name="startupMethod.keyboardParam"
              formLabel={t("startupMethod_param_keyboard")}
              placeholder={t("startupMethod_keyboard_placeholder")}
              options={e2a(KEYBOARD)
                .filter((k) => k != KEYBOARD.META)
                .map((key) => ({
                  name: t(`keyboardParam_${key}_${os}`),
                  value: key,
                }))}
            />
          )}
          {startupMethod === STARTUP_METHOD.LEFT_CLICK_HOLD && (
            <InputField
              control={form.control}
              name="startupMethod.leftClickHoldParam"
              formLabel={t("startupMethod_param_leftClickHold")}
              unit="ms"
              inputProps={{
                type: "number",
                min: 50,
                max: 500,
                step: 10,
                ...register("startupMethod.leftClickHoldParam", {
                  valueAsNumber: true,
                }),
              }}
            />
          )}
          {getValues("popupPlacement") != null &&
            startupMethod !== STARTUP_METHOD.CONTEXT_MENU && (
              <PopupPlacementField
                onSubmit={handlePopupPlacementSubmit}
                defaultValues={getValues("popupPlacement")}
              />
            )}
        </section>
        <hr />
        <section id="commands" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <SquareTerminal size={22} className="mr-2 stroke-gray-600" />
            {t("commands")}
          </h3>
          <p className="text-base">{t("commands_desc")}</p>
          <CommandList control={form.control} />
        </section>
        <hr />

        <section id="shortcuts" className="space-y-3">
          <ShortcutList control={form.control} />
        </section>
        <hr />

        <section id="linkCommand" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <Eye size={22} className="mr-2 stroke-gray-600" />
            {t("linkCommand")}
          </h3>
          <p className="text-base">{t("linkCommand_desc")}</p>
          <SelectField
            control={form.control}
            name="linkCommand.enabled"
            formLabel={t("linkCommandEnabled")}
            options={e2a(LINK_COMMAND_ENABLED)
              .filter((opt) => opt !== LINK_COMMAND_ENABLED.INHERIT)
              .map((opt) => ({
                name: t(`linkCommand_enabled${opt}`),
                value: opt,
              }))}
          />
          <SelectField
            control={form.control}
            name="linkCommand.openMode"
            formLabel={t("openMode")}
            options={e2a(DRAG_OPEN_MODE).map((opt) => ({
              name: t(`openMode_${opt}`),
              value: opt,
            }))}
          />
          <SelectField
            control={form.control}
            name="linkCommand.startupMethod.method"
            formLabel={t("linkCommandStartupMethod_method")}
            options={e2a(LINK_COMMAND_STARTUP_METHOD).map((opt) => ({
              name: t(`linkCommandStartupMethod_${opt}`),
              value: opt,
            }))}
          />
          {linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.KEYBOARD && (
            <SelectField
              control={form.control}
              name="linkCommand.startupMethod.keyboardParam"
              formLabel={t("linkCommandStartupMethod_keyboard")}
              options={e2a(KEYBOARD)
                .filter((k) => k != KEYBOARD.META)
                .map((key) => ({
                  name: t(`keyboardParam_${key}_${os}`),
                  value: key,
                }))}
            />
          )}
          {linkCommandMethod === LINK_COMMAND_STARTUP_METHOD.DRAG && (
            <InputField
              control={form.control}
              name="linkCommand.startupMethod.threshold"
              formLabel={t("linkCommandStartupMethod_threshold")}
              description={t("linkCommandStartupMethod_threshold_desc")}
              unit="px"
              inputProps={{
                type: "number",
                min: 50,
                max: 400,
                step: 10,
                ...register("linkCommand.startupMethod.threshold", {
                  valueAsNumber: true,
                }),
              }}
            />
          )}
          {linkCommandMethod ===
            LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD && (
            <InputField
              control={form.control}
              name="linkCommand.startupMethod.leftClickHoldParam"
              formLabel={t("linkCommandStartupMethod_leftClickHoldParam")}
              description={t(
                "linkCommandStartupMethod_leftClickHoldParam_desc",
              )}
              unit="ms"
              inputProps={{
                type: "number",
                min: 50,
                max: 500,
                step: 10,
                ...register("linkCommand.startupMethod.leftClickHoldParam", {
                  valueAsNumber: true,
                }),
              }}
            />
          )}
          <SwitchField
            control={form.control}
            name="linkCommand.showIndicator"
            formLabel={t("showIndicator")}
            description={t("showIndicator_desc")}
          />
        </section>
        <hr />

        <section id="pageRules" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <BookOpen size={22} className="mr-2 stroke-gray-600" />
            {t("pageRules")}
          </h3>
          <p className="text-base">{t("pageRules_desc")}</p>
          <PageRuleList
            control={form.control}
            linkCommandEnabled={getValues("linkCommand.enabled")}
          />
        </section>
        <hr />
        <section id="userStyles" className="space-y-3">
          <h3 className="text-xl font-semibold flex items-center">
            <Paintbrush size={22} className="mr-2 stroke-gray-600" />
            {t("userStyles")}
          </h3>
          <p className="text-base">{t("userStyles_desc")}</p>
          <UserStyleList control={form.control} />
        </section>
      </form>
    </Form>
  )
}
