import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Sparkles, CircleHelp, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { t as _t } from "@/services/i18n"
import { searchUrlAssistAction } from "@/services/searchUrlAssist"
import { PageAction } from "@/action/pageAction"

const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

import css from "@/components/ui/collapsible.module.css"

const assistFormSchema = z.object({
  searchKeyword: z
    .string()
    .min(1, t("searchUrlAssist_validation_keyword_required")),
  searchResultUrl: z.string().url(t("searchUrlAssist_validation_url_invalid")),
})

type AssistFormData = z.infer<typeof assistFormSchema>

type SearchUrlAssistDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SearchUrlAssistDialog = ({
  open,
  onOpenChange,
}: SearchUrlAssistDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const form = useForm<AssistFormData>({
    resolver: zodResolver(assistFormSchema),
    mode: "onChange",
    defaultValues: {
      searchKeyword: "test",
      searchResultUrl: "",
    },
  })

  const handleGeminiExecution = async (data: AssistFormData) => {
    setIsProcessing(true)

    try {
      const command = searchUrlAssistAction
      PageAction.execute({
        selectionText: "",
        command,
        position: { x: 0, y: 0 },
        useSecondary: false,
        useClipboard: false,
        userVariables: [
          { name: "search_keyword", value: data.searchKeyword },
          { name: "search_result_url", value: data.searchResultUrl },
        ],
      })

      // Close the dialog after launching Gemini
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to execute Gemini assist:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={20} />
            {t("searchUrlAssist_title")}
          </DialogTitle>
          <DialogDescription>{t("searchUrlAssist_desc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="searchKeyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("searchUrlAssist_searchKeyword")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "searchUrlAssist_searchKeyword_placeholder",
                      )}
                      disabled={isProcessing}
                      className="mt-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="searchResultUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("searchUrlAssist_searchResultUrl")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t(
                        "searchUrlAssist_searchResultUrl_placeholder",
                      )}
                      disabled={isProcessing}
                      className="mt-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-2 rounded-lg text-sm text-blue-800">
              <Collapsible className={css.collapse}>
                <CollapsibleTrigger className="flex items-center gap-1 hover:bg-blue-100 px-2 h-[40px] rounded-lg text-sm font-semibold transition">
                  <CircleHelp className="size-4" />
                  {t("searchUrlAssist_howToUse")}
                  <ChevronRight size={16} className={cn(css.iconRight)} />
                </CollapsibleTrigger>
                <CollapsibleContent
                  className={cn(css.CollapsibleContent, "px-2 py-1 space-y-3")}
                >
                  <video
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    className="rounded-md w-full mx-auto aspect-[3/2]"
                  >
                    <source
                      src="https://github.com/ujiro99/selection-command/raw/refs/heads/main/docs/Search/Search%20URL%20AI%20assist.mp4"
                      type="video/mp4"
                    />
                  </video>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>{t("searchUrlAssist_step1")}</li>
                    <li>{t("searchUrlAssist_step2")}</li>
                    <li>{t("searchUrlAssist_step3")}</li>
                    <li>{t("searchUrlAssist_step4")}</li>
                    <li>{t("searchUrlAssist_step5")}</li>
                  </ol>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </Form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isProcessing}>
              {t("labelCancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={form.handleSubmit(handleGeminiExecution)}
            disabled={isProcessing}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles size={16} className="mr-1.5" />
            {isProcessing
              ? t("searchUrlAssist_executing")
              : t("searchUrlAssist_executeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
