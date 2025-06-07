'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Image } from '@/components/Image'
import { useLocale } from '@/hooks/useLocale'
import { Send, SquareArrowOutUpRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { UninstallFormType } from '@/types'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { UNINSTALL_OTHER_OPTION } from '@/const'
import { cn } from '@/lib/utils'

import css from './CommandForm.module.css'

type UninstallReason = {
  id: string
  label: string
}

const SubmitStatus = {
  IDLE: 'idle',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

type SubmitStatusType = (typeof SubmitStatus)[keyof typeof SubmitStatus]

export function UninstallForm() {
  const { dict, lang } = useLocale()
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<SubmitStatusType>(
    SubmitStatus.IDLE,
  )
  const [uninstallReasons, setUninstallReasons] = useState<UninstallReason[]>(
    [],
  )
  const [isInitialized, setIsInitialized] = useState(false)

  // Randomize order only on the client side
  useEffect(() => {
    const entries = Object.entries(dict.uninstallForm.reasons)
    const otherEntry = entries.find(([id]) => id === UNINSTALL_OTHER_OPTION)
    const otherEntries = entries.filter(([id]) => id !== UNINSTALL_OTHER_OPTION)

    // Shuffle entries except for "Other" option
    const shuffledEntries = otherEntries.sort(() => Math.random() - 0.5)

    // Add "Other" option at the end if it exists
    const finalEntries = otherEntry
      ? [...shuffledEntries, otherEntry]
      : shuffledEntries

    setUninstallReasons(
      finalEntries.map(([id, label]) => ({
        id,
        label: label as string,
      })),
    )
    setIsInitialized(true)
  }, [dict.uninstallForm.reasons])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(SubmitStatus.IDLE)

    try {
      const response = await submit({
        uninstallReason: selectedReasons,
        details,
        otherReason: selectedReasons.includes(UNINSTALL_OTHER_OPTION)
          ? otherReason
          : '',
        locale: lang,
      } as UninstallFormType)

      if (!response.success) {
        throw new Error('Failed to submit form')
      }

      setSubmitStatus(SubmitStatus.SUCCESS)
      setSelectedReasons([])
      setOtherReason('')
      setDetails('')
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus(SubmitStatus.ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        'max-w-2xl mx-auto p-6',
        !isInitialized && 'opacity-0',
        isInitialized && 'transition-opacity duration-50',
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
              className="ml-6 w-auto h-auto"
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
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {dict.uninstallForm.reasonTitle}
              </h2>
              <div className="space-y-3">
                {uninstallReasons.map((reason) => (
                  <div key={reason.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={reason.id}
                      checked={selectedReasons.includes(reason.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedReasons([...selectedReasons, reason.id])
                        } else {
                          setSelectedReasons(
                            selectedReasons.filter((id) => id !== reason.id),
                          )
                        }
                      }}
                    />
                    <label
                      htmlFor={reason.id}
                      className="text-sm font-medium cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {reason.label}
                    </label>
                  </div>
                ))}
              </div>

              <Collapsible
                open={selectedReasons.includes(UNINSTALL_OTHER_OPTION)}
              >
                <CollapsibleContent className={css.CollapsibleContent}>
                  <div className="ml-6 mt-2">
                    <Input
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder={dict.uninstallForm.otherReasonPlaceholder}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">
                {dict.uninstallForm.detailsTitle}
              </h2>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
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
                disabled={selectedReasons.length === 0 || isSubmitting}
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
    const { uninstallReason, details, locale, otherReason }: UninstallFormType =
      param

    // Create form data
    const formData = new FormData()
    uninstallReason.forEach((reason) => {
      formData.append('entry.90439598', reason)
    })
    if (otherReason) {
      formData.append('entry.90439598.other_option_response', otherReason)
    }
    formData.append('entry.1954317629', locale)
    formData.append('entry.2091766235', details)

    // Send form data to Google Forms
    const formUrl =
      'https://docs.google.com/forms/d/e/1FAIpQLSeKp9yy9i4dB3CK7qyKZoaDdrRB8a6dCVnm0zALl7mo-yvbXg/formResponse'
    fetch(formUrl, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
    })

    return { success: true }
  } catch (error) {
    console.error('Error processing uninstall form:', error)
    return { success: false, error: 'Failed to process form submission' }
  }
}
