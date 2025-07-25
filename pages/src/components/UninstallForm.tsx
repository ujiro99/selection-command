"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Image } from "@/components/Image"
import { useLocale } from "@/hooks/useLocale"
import { Send, SquareArrowOutUpRight } from "lucide-react"
import { useState, useEffect } from "react"
import type { UninstallFormType } from "@/types"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { UNINSTALL_OTHER_OPTION, OTHER_OPTION } from "@/const"
import { cn, sleep } from "@/lib/utils"

import css from "./CommandForm.module.css"

type UninstallReason = {
  id: string
  label: string
}

const SubmitStatus = {
  IDLE: "idle",
  SUCCESS: "success",
  ERROR: "error",
} as const

type SubmitStatusType = (typeof SubmitStatus)[keyof typeof SubmitStatus]

// Helper function to shuffle options and put "Other" at the end
function shuffleOptionsWithOtherLast(
  entries: [string, unknown][],
  otherOptionKey: string,
): UninstallReason[] {
  const otherEntry = entries.find(([id]) => id === otherOptionKey)
  const otherEntries = entries.filter(([id]) => id !== otherOptionKey)

  // Shuffle entries except for "Other" option
  const shuffledEntries = otherEntries.sort(() => Math.random() - 0.5)

  // Add "Other" option at the end if it exists
  const finalEntries = otherEntry
    ? [...shuffledEntries, otherEntry]
    : shuffledEntries

  return finalEntries.map(([id, label]) => ({
    id,
    label: label as string,
  }))
}

// Custom hook for form state management
function useUninstallFormState() {
  const [formState, setFormState] = useState({
    selectedReasons: [] as string[],
    selectedWantedToUse: [] as string[],
    details: "",
    otherReason: "",
    otherWantedToUse: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatusType>(
    SubmitStatus.IDLE,
  )

  const updateFormState = (updates: Partial<typeof formState>) => {
    setFormState((prev) => ({ ...prev, ...updates }))
  }

  const resetForm = () => {
    setFormState({
      selectedReasons: [],
      selectedWantedToUse: [],
      details: "",
      otherReason: "",
      otherWantedToUse: "",
    })
  }

  return {
    formState,
    updateFormState,
    resetForm,
    isSubmitting,
    setIsSubmitting,
    submitStatus,
    setSubmitStatus,
  }
}

// CheckboxGroup component for reusable checkbox logic
type CheckboxGroupProps = {
  options: UninstallReason[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  idPrefix?: string
}

function CheckboxGroup({
  options,
  selectedValues,
  onSelectionChange,
  idPrefix = "",
}: CheckboxGroupProps) {
  const handleChange = (optionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, optionId])
    } else {
      onSelectionChange(selectedValues.filter((id) => id !== optionId))
    }
  }

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={`${idPrefix}${option.id}`}
            checked={selectedValues.includes(option.id)}
            onCheckedChange={(checked: boolean) =>
              handleChange(option.id, checked)
            }
          />
          <label
            htmlFor={`${idPrefix}${option.id}`}
            className="text-sm font-medium cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  )
}

export function UninstallForm() {
  const { dict, lang } = useLocale()
  const {
    formState,
    updateFormState,
    resetForm,
    isSubmitting,
    setIsSubmitting,
    submitStatus,
    setSubmitStatus,
  } = useUninstallFormState()

  const [uninstallReasons, setUninstallReasons] = useState<UninstallReason[]>(
    [],
  )
  const [wantedToUseOptions, setWantedToUseOptions] = useState<
    UninstallReason[]
  >([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Randomize order only on the client side
  useEffect(() => {
    // Process uninstall reasons
    const reasonEntries = Object.entries(dict.uninstallForm.reasons)
    setUninstallReasons(
      shuffleOptionsWithOtherLast(reasonEntries, UNINSTALL_OTHER_OPTION),
    )

    // Process wanted to use options
    const wantedEntries = Object.entries(dict.uninstallForm.wantedToUse)
    setWantedToUseOptions(
      shuffleOptionsWithOtherLast(wantedEntries, OTHER_OPTION),
    )

    setIsInitialized(true)
  }, [dict.uninstallForm.reasons, dict.uninstallForm.wantedToUse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(SubmitStatus.IDLE)

    try {
      const response = await submit({
        uninstallReason: formState.selectedReasons,
        wantedToUse: formState.selectedWantedToUse,
        details: formState.details,
        otherReason: formState.selectedReasons.includes(UNINSTALL_OTHER_OPTION)
          ? formState.otherReason
          : "",
        otherWantedToUse: formState.selectedWantedToUse.includes(OTHER_OPTION)
          ? formState.otherWantedToUse
          : "",
        locale: lang,
      } as UninstallFormType)

      if (!response.success) {
        throw new Error("Failed to submit form")
      }

      await sleep(1000)
      setSubmitStatus(SubmitStatus.SUCCESS)
      resetForm()
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitStatus(SubmitStatus.ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "max-w-2xl mx-auto p-6",
        !isInitialized && "opacity-0",
        isInitialized && "transition-opacity duration-50",
      )}
    >
      {submitStatus === SubmitStatus.SUCCESS ? (
        <>
          <h1 className="text-3xl font-bold text-center mb-8">
            {dict.uninstallForm.success.title}
          </h1>
          <div className="flex items-center">
            <div className="p-6 bg-green-50 rounded-lg">
              <p className="text-green-700 leading-relaxed whitespace-pre-line">
                {dict.uninstallForm.success.message}
              </p>
            </div>
            <Image
              src="/ozigi_suit_man_simple.png"
              alt="Thank you"
              className="ml-6 w-auto h-[230px]"
              width={60}
              height={210}
              loading="lazy"
            />
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-center mb-8">
            {dict.uninstallForm.title}
          </h1>
          <p className="mb-6 break-words whitespace-pre-line">
            {dict.uninstallForm.description}
          </p>
          <p>{dict.uninstallForm.reinstall}</p>
          <a
            href="https://chromewebstore.google.com/detail/selection-command/nlnhbibaommoelemmdfnkjkgoppkohje?utm_source=selection-command-hub&utm_medium=link&utm_campaign=uninstall-form"
            target="_blank"
            className="text-blue-500 flex items-center gap-1 mb-6"
          >
            Chrome Web Store
            <SquareArrowOutUpRight size={14} />
          </a>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* wanted to use */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {dict.uninstallForm.wantedToUseTitle}
              </h2>
              <CheckboxGroup
                options={wantedToUseOptions}
                selectedValues={formState.selectedWantedToUse}
                onSelectionChange={(values) =>
                  updateFormState({ selectedWantedToUse: values })
                }
                idPrefix="wanted-"
              />

              <Collapsible
                open={formState.selectedWantedToUse.includes(OTHER_OPTION)}
              >
                <CollapsibleContent className={css.CollapsibleContent}>
                  <div className="ml-6 mt-2">
                    <Input
                      value={formState.otherWantedToUse}
                      onChange={(e) =>
                        updateFormState({ otherWantedToUse: e.target.value })
                      }
                      placeholder={dict.uninstallForm.wantedToUsePlaceholder}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* uninstall reason */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {dict.uninstallForm.reasonTitle}
              </h2>
              <CheckboxGroup
                options={uninstallReasons}
                selectedValues={formState.selectedReasons}
                onSelectionChange={(values) =>
                  updateFormState({ selectedReasons: values })
                }
              />

              <Collapsible
                open={formState.selectedReasons.includes(
                  UNINSTALL_OTHER_OPTION,
                )}
              >
                <CollapsibleContent className={css.CollapsibleContent}>
                  <div className="ml-6 mt-2">
                    <Input
                      value={formState.otherReason}
                      onChange={(e) =>
                        updateFormState({ otherReason: e.target.value })
                      }
                      placeholder={dict.uninstallForm.otherReasonPlaceholder}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* detail */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {dict.uninstallForm.detailsTitle}
              </h2>
              <Textarea
                value={formState.details}
                onChange={(e) => updateFormState({ details: e.target.value })}
                className="min-h-[100px]"
                placeholder={dict.uninstallForm.detailsPlaceholder}
              />
            </div>

            {submitStatus === SubmitStatus.ERROR && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-red-700">{dict.uninstallForm.error}</p>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="submit"
                className="rounded-xl font-semibold bg-stone-700 px-8"
                disabled={
                  (formState.selectedReasons.length === 0 &&
                    formState.selectedWantedToUse.length === 0) ||
                  isSubmitting
                }
              >
                <Send className="mr-1" />
                {isSubmitting
                  ? dict.uninstallForm.submitting
                  : dict.uninstallForm.submit}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

async function submit(
  param: UninstallFormType,
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      uninstallReason,
      wantedToUse,
      details,
      locale,
      otherReason,
      otherWantedToUse,
    }: UninstallFormType = param

    // Create form data
    const formData = new FormData()
    // 1. wanted to use
    wantedToUse.forEach((feature) => {
      formData.append("entry.1077095346", feature)
    })
    if (otherWantedToUse) {
      formData.append(
        "entry.1077095346.other_option_response",
        otherWantedToUse,
      )
    }
    // 2. uninstall reason
    uninstallReason.forEach((reason) => {
      formData.append("entry.90439598", reason)
    })
    if (otherReason) {
      formData.append("entry.90439598.other_option_response", otherReason)
    }
    // 3. details
    formData.append("entry.2091766235", details)
    // 4. locale
    formData.append("entry.1954317629", locale)

    // Send form data to Google Forms
    const formUrl =
      "https://docs.google.com/forms/d/e/1FAIpQLSeKp9yy9i4dB3CK7qyKZoaDdrRB8a6dCVnm0zALl7mo-yvbXg/formResponse"
    fetch(formUrl, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    })

    return { success: true }
  } catch (error) {
    console.error("Error processing uninstall form:", error)
    return { success: false, error: "Failed to process form submission" }
  }
}
