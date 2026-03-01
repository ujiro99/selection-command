import { useState, useEffect, useRef } from "react"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { OpenModeToggleField } from "@/components/option/field/OpenModeToggleField"
import { SelectField } from "@/components/option/field/SelectField"
import { InputMenu } from "@/components/pageAction/InputPopup"
import { AI_SERVICES } from "@/services/aiPrompt"
import { t as _t } from "@/services/i18n"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

type AiPromptSectionProps = {
  form: any
}

export const AiPromptSection = ({ form }: AiPromptSectionProps) => {
  const { register } = form
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const updateHeight = (elm: HTMLTextAreaElement) => {
    elm.style.height = "5px"
    elm.style.height = elm.scrollHeight + "px"
  }

  useEffect(() => {
    if (textareaRef.current) {
      updateHeight(textareaRef.current)
    }
  }, [])

  const serviceOptions = AI_SERVICES.map((s) => ({
    name: s.name,
    value: s.id,
  }))

  return (
    <>
      <SelectField
        control={form.control}
        name="aiPromptOption.serviceId"
        formLabel={t("aiPrompt_service")}
        description={t("aiPrompt_service_desc")}
        options={serviceOptions}
      />

      <OpenModeToggleField
        control={form.control}
        name="aiPromptOption.openMode"
        formLabel={t("pageAction_openMode")}
        description={t("displayMode_desc")}
        type="pageAction"
      />

      <FormField
        control={form.control}
        name="aiPromptOption.prompt"
        render={({ field }) => (
          <FormItem className="flex items-start gap-1">
            <div className="w-2/6">
              <FormLabel>{t("aiPrompt_prompt")}</FormLabel>
              <FormDescription>{t("aiPrompt_prompt_desc")}</FormDescription>
            </div>
            <div className="w-4/6 relative">
              <InputMenu
                targetElm={textarea}
                className="w-fit relative left-[100%] -translate-x-[100%] -top-1 mb-1"
              />
              <FormControl>
                <Textarea
                  {...field}
                  {...register("aiPromptOption.prompt", {})}
                  ref={(el) => {
                    setTextarea(el)
                    textareaRef.current = el
                    field.ref(el)
                  }}
                  rows={5}
                  placeholder={t("aiPrompt_prompt_placeholder")}
                  className="resize-none max-h-80"
                  onInput={(e) => {
                    updateHeight(e.target as HTMLTextAreaElement)
                  }}
                />
              </FormControl>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </>
  )
}
