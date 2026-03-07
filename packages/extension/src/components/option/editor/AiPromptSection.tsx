import { useState, useEffect } from "react"
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
import {
  convSymbolsToReadableKeys,
  convReadableKeysToSymbols,
} from "@/services/pageAction"
import { getAiServicesFallback } from "@/services/aiPrompt"
import { t as _t } from "@/services/i18n"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

const AI_SERVICES = getAiServicesFallback()

type AiPromptSectionProps = {
  form: any
}

export const AiPromptSection = ({ form }: AiPromptSectionProps) => {
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)

  const serviceId = form.watch("aiPromptOption.serviceId")

  // Auto-set iconUrl to the selected service's favicon when iconUrl is not set
  useEffect(() => {
    if (!serviceId) return
    const currentIconUrl = form.getValues("iconUrl")
    const isDefaultIcon = AI_SERVICES.some(
      (s) => s.faviconUrl === currentIconUrl,
    )
    if (currentIconUrl && !isDefaultIcon) return
    const service = AI_SERVICES.find((s) => s.id === serviceId)
    if (service?.faviconUrl) {
      form.setValue("iconUrl", service.faviconUrl)
    }
  }, [serviceId, form])

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
        type="search"
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
                  value={convSymbolsToReadableKeys(field.value)}
                  onChange={(e) =>
                    field.onChange(convReadableKeysToSymbols(e.target.value))
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={(el) => {
                    setTextarea(el)
                    field.ref(el)
                  }}
                  rows={5}
                  placeholder={t("aiPrompt_prompt_placeholder")}
                  className="max-h-80"
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
