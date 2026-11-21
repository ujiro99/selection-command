import { useForm, useWatch } from "react-hook-form"
import { useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronRight, Check } from "lucide-react"

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PopupSpeedPreview } from "@/components/option/editor/PopupSpeedPreview"

import { Attributes } from "@/services/option/userStyles"
import {
  POPUP_SPEED,
  POPUP_SPEEDS,
  detectPopupSpeed,
  getEffectivePopupSpeedValues,
  getPresetValues,
  isPopupDelayIgnored,
  type PopupSpeedValues,
} from "@/services/option/popupSpeed"

import { STARTUP_METHOD, STYLE_VARIABLE } from "@/const"
import { cn, hyphen2Underscore } from "@/lib/utils"
import { t } from "@/services/i18n"

import collapsibleCss from "@/components/ui/collapsible.module.css"

// Speed schema for local form
const speedSchema = z.object({
  popupDelay: z
    .number()
    .min(Attributes[STYLE_VARIABLE.POPUP_DELAY].min as number)
    .max(Attributes[STYLE_VARIABLE.POPUP_DELAY].max as number),
  popupDuration: z
    .number()
    .min(Attributes[STYLE_VARIABLE.POPUP_DURATION].min as number)
    .max(Attributes[STYLE_VARIABLE.POPUP_DURATION].max as number),
})

type Props = {
  onSubmit: (data: PopupSpeedValues) => void
  defaultValues: PopupSpeedValues
  startupMethod: STARTUP_METHOD
}

export const PopupSpeed = ({
  onSubmit,
  defaultValues,
  startupMethod,
}: Props) => {
  const form = useForm<PopupSpeedValues>({
    resolver: zodResolver(speedSchema),
    mode: "onChange",
    defaultValues: defaultValues,
  })
  const { register, reset, setValue, control } = form
  const [previewSpeed, setPreviewSpeed] = useState<POPUP_SPEED | null>(null)

  useEffect(() => {
    const subscription = form.subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        // Skip invalid values (e.g. an empty input gives NaN) so they are
        // neither saved nor fed back as new default values.
        if (onSubmit && values && speedSchema.safeParse(values).success) {
          onSubmit(values as PopupSpeedValues)
        }
      },
    })

    return () => subscription()
  }, [onSubmit, form])

  // Sync local form when defaultValues change from parent
  const previousDefaultValuesRef = useRef(defaultValues)

  useEffect(() => {
    const previousValues = previousDefaultValuesRef.current
    const hasDefaultValuesChanged =
      !Object.is(previousValues.popupDelay, defaultValues.popupDelay) ||
      !Object.is(previousValues.popupDuration, defaultValues.popupDuration)

    if (hasDefaultValuesChanged) {
      reset(defaultValues)
      previousDefaultValuesRef.current = defaultValues
    }
  }, [defaultValues.popupDelay, defaultValues.popupDuration, reset])

  const [popupDelay, popupDuration] = useWatch({
    control,
    name: ["popupDelay", "popupDuration"],
  })
  const currentSpeed = detectPopupSpeed(
    { popupDelay, popupDuration },
    startupMethod,
  )
  const delayIgnored = isPopupDelayIgnored(startupMethod)

  const applyPreset = (speed: POPUP_SPEED) => {
    const values = getPresetValues(speed)
    const opts = { shouldValidate: true, shouldDirty: true }
    // Keep the stored delay when it has no effect for the startup method.
    if (!delayIgnored) setValue("popupDelay", values.popupDelay, opts)
    setValue("popupDuration", values.popupDuration, opts)
  }

  const inputs = [
    {
      key: "popupDelay" as const,
      variable: STYLE_VARIABLE.POPUP_DELAY,
      disabled: delayIgnored,
    },
    {
      key: "popupDuration" as const,
      variable: STYLE_VARIABLE.POPUP_DURATION,
      disabled: false,
    },
  ]

  return (
    <Collapsible className={cn(collapsibleCss.collapse, "flex flex-col")}>
      <CollapsibleTrigger className="flex items-center justify-start gap-2 hover:bg-hover -ml-2 px-2 w-[100% + 8px] h-[40px] rounded-lg text-sm font-semibold transition">
        <ChevronRight size={18} className={cn(collapsibleCss.iconRight)} />
        <span className="mr-1">{t("Option_popupSpeed")}</span>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(collapsibleCss.CollapsibleContent, "w-full py-4")}
      >
        <div className="flex flex-col space-y-3 ml-4">
          <FormItem className="flex items-start gap-1">
            <div className="w-2/6">
              <FormLabel>{t("Option_popupSpeed_preset")}</FormLabel>
            </div>
            <div className="w-4/6 flex items-stretch gap-6">
              <ToggleGroup
                type="single"
                variant="outline"
                value={currentSpeed ?? ""}
                onValueChange={(val) => {
                  if (val) applyPreset(val as POPUP_SPEED)
                }}
                onMouseLeave={() => setPreviewSpeed(null)}
                onBlur={() => setPreviewSpeed(null)}
                className="flex flex-col w-2/5 shrink-0 gap-2 p-0.5"
              >
                {POPUP_SPEEDS.map((speed) => (
                  <ToggleGroupItem
                    key={speed}
                    value={speed}
                    onMouseEnter={() => setPreviewSpeed(speed)}
                    onFocus={() => setPreviewSpeed(speed)}
                    className={cn(
                      "relative w-full h-10 shadow-xs text-xs font-mono text-gray-600 dark:text-gray-400 dark:bg-(--sc-input-bg,var(--color-gray-800))",
                      "hover:bg-hover data-[state=on]:bg-selected data-[state=on]:hover:bg-selected",
                    )}
                  >
                    {currentSpeed === speed && (
                      <Check size={16} className="absolute left-4" />
                    )}
                    {t(`Option_popupSpeed_${speed}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <PopupSpeedPreview
                values={getEffectivePopupSpeedValues(
                  // Preview the hovered preset, otherwise the current values.
                  previewSpeed != null
                    ? getPresetValues(previewSpeed)
                    : { popupDelay, popupDuration },
                  startupMethod,
                )}
              />
            </div>
          </FormItem>

          {inputs.map(({ key, variable, disabled }) => {
            const attr = Attributes[variable]
            const name = hyphen2Underscore(variable)
            const labelText = t(`Option_userStyles_option_${name}`)
            const descText = disabled
              ? t("Option_popupSpeed_delayIgnored")
              : t(`Option_userStyles_desc_${name}`)

            return (
              <FormItem
                className={cn(
                  "flex items-center gap-1",
                  disabled && "opacity-50",
                )}
                key={key}
              >
                <div className="w-2/6">
                  <FormLabel>{labelText}</FormLabel>
                  <FormDescription>{descText}</FormDescription>
                </div>
                <div className="w-4/6 relative">
                  {disabled ? (
                    // Not registered: a disabled registered input would be
                    // read as undefined by react-hook-form.
                    <Input unit={"ms"} {...attr} value={0} disabled readOnly />
                  ) : (
                    <FormControl>
                      <Input
                        unit={"ms"}
                        {...register(key, { valueAsNumber: true })}
                        {...attr}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </div>
              </FormItem>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
