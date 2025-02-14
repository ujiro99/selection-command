import React, { useState, useEffect, useRef } from 'react'
import { CSSTransition } from 'react-transition-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { LoadingIcon } from '@/components/option/LoadingIcon'

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
import type { SettingsType } from '@/types'
import { isMenuCommand, isLinkCommand, isMac, sleep, e2a } from '@/lib/utils'
import { Settings } from '@/services/settings'

function hyphen2Underscore(input: string): string {
  return input.replace(/-/g, '_')
}

const formSchema = z
  .object({
    startupMethod: z
      .object({
        method: z.nativeEnum(STARTUP_METHOD),
        keyboardParam: z
          .nativeEnum(KEYBOARD)
          .optional()
          .refine((val) => val !== KEYBOARD.META),
        leftClickHoldParam: z.number().min(50).max(500).step(10).optional(),
      })
      .strict(),
    popupPlacement: z.nativeEnum(POPUP_PLACEMENT),
    style: z.nativeEnum(STYLE),
    commands: z
      .array(
        z
          .object({
            title: z.string(),
            iconUrl: z.string(),
            openMode: z
              .nativeEnum(OPEN_MODE)
              .refine(
                (val) =>
                  val !== OPEN_MODE.OPTION && val !== OPEN_MODE.ADD_PAGE_RULE,
              ),
            parentFolderId: z.string().optional(),
            searchUrl: z.string().optional(),
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
          .refine((val) => val !== LINK_COMMAND_ENABLED.INHERIT),
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

export function SettingForm() {
  const initializedRef = useRef<boolean>(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveToRef = useRef<number>()
  const iconToRef = useRef<number>()
  const [settingData, setSettingData] = useState<SettingsType | undefined>()
  const loadingRef = useRef<HTMLDivElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  })

  const { getValues, register } = form

  const { fields, append, remove } = useFieldArray({
    name: 'commands',
    control: form.control,
  })

  const updateSettings = async (settings: SettingsType) => {
    if (isSaving) return
    try {
      setIsSaving(true)
      const current = await Settings.get(true)
      const linkCommands = current.commands.filter(isLinkCommand).map((c) => ({
        ...c,
        openMode: settings.linkCommand.openMode,
      }))
      settings.commands = [...settings.commands, ...linkCommands]
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
