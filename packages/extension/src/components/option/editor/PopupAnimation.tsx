import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronRight } from "lucide-react"
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

import { Attributes } from "@/services/option/userStyles"

import { STYLE_VARIABLE } from "@/const"
import { cn, hyphen2Underscore } from "@/lib/utils"
import { t } from "@/services/i18n"

import collapsibleCss from "@/components/ui/collapsible.module.css"

// Animation schema for local form
const animationSchema = z.object({
  popupDelay: z
    .number()
    .min(Attributes[STYLE_VARIABLE.POPUP_DELAY].min as number)
    .max(Attributes[STYLE_VARIABLE.POPUP_DELAY].max as number),
  popupDuration: z
    .number()
    .min(Attributes[STYLE_VARIABLE.POPUP_DURATION].min as number)
    .max(Attributes[STYLE_VARIABLE.POPUP_DURATION].max as number),
})

type AnimationValues = z.infer<typeof animationSchema>

type Props = {
  onSubmit: (data: AnimationValues) => void
  defaultValues: AnimationValues
}

export const PopupAnimation = ({ onSubmit, defaultValues }: Props) => {
  const form = useForm<AnimationValues>({
    resolver: zodResolver(animationSchema),
    mode: "onChange",
    defaultValues: defaultValues,
  })
  const { register } = form

  useEffect(() => {
    const subscription = form.subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        if (onSubmit && values) {
          onSubmit(values as AnimationValues)
        }
      },
    })

    return subscription
  }, [onSubmit, form])

  // Sync local form when defaultValues change from parent
  useEffect(() => {
    const currentValues = form.getValues()
    const hasChanged =
      currentValues.popupDelay !== defaultValues.popupDelay ||
      currentValues.popupDuration !== defaultValues.popupDuration

    if (hasChanged) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  const animations = [
    {
      key: "popupDelay" as keyof AnimationValues,
      variable: STYLE_VARIABLE.POPUP_DELAY,
    },
    {
      key: "popupDuration" as keyof AnimationValues,
      variable: STYLE_VARIABLE.POPUP_DURATION,
    },
  ]

  return (
    <Collapsible className={cn(collapsibleCss.collapse, "flex flex-col")}>
      <CollapsibleTrigger className="flex items-center hover:bg-gray-100 -ml-2 px-2 h-[40px] rounded-lg text-sm font-semibold self-start transition">
        <span className="mr-1">{t("Option_popupAnimation")}</span>
        <ChevronRight size={18} className={cn(collapsibleCss.iconRight)} />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(collapsibleCss.CollapsibleContent, "w-full py-4")}
      >
        <div className="flex flex-col space-y-3 ml-4">
          {animations.map(({ key, variable }) => {
            const attr = Attributes[variable]
            const name = hyphen2Underscore(variable)
            const labelText = t(`Option_userStyles_option_${name}`)
            const descText = t(`Option_userStyles_desc_${name}`)

            return (
              <FormItem className="flex items-center gap-1" key={key}>
                <div className="w-2/6">
                  <FormLabel>{labelText}</FormLabel>
                  <FormDescription>{descText}</FormDescription>
                </div>
                <div className="w-4/6 relative">
                  <FormControl>
                    <Input
                      unit={"ms"}
                      {...register(key, { valueAsNumber: true })}
                      {...attr}
                    />
                  </FormControl>
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
