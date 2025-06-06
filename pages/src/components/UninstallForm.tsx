'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useLocale } from '@/hooks/useLocale'
import { Send } from 'lucide-react'
import { useState } from 'react'
import type { UninstallFormType } from '@/types'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'

import css from './CommandForm.module.css'

type UninstallReason = {
  id: string
  label: string
}

const uninstallReasons: UninstallReason[] = [
  { id: 'difficult_to_use', label: '使い方が分からなかった' },
  { id: 'not_user_friendly', label: '使いづらかった' },
  { id: 'not_working', label: '期待通りに動作しなかった' },
  { id: 'missing_features', label: '必要な機能がなかった' },
  { id: 'too_many_permissions', label: '必要な権限が多すぎる' },
  { id: 'found_better', label: 'より良い代替製品を見つけた' },
  { id: 'no_longer_needed', label: 'もう必要なくなった' },
  { id: 'language_not_supported', label: '希望する言語に対応していない' },
  { id: 'other', label: 'その他' },
]

type SubmitResponse = {
  success: boolean
  error?: string
}

export async function submit(
  param: UninstallFormType,
): Promise<SubmitResponse> {
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
    console.log(formData)

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

export function UninstallForm() {
  const { dict, lang } = useLocale()
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await submit({
        uninstallReason: selectedReasons,
        details,
        otherReason: selectedReasons.includes('other') ? otherReason : '',
        locale: lang,
      } as UninstallFormType)

      if (!response.success) {
        throw new Error('Failed to submit form')
      }

      setSubmitStatus('success')
      setSelectedReasons([])
      setOtherReason('')
      setDetails('')
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-8">
        アンインストールが完了しました
      </h1>
      <p className="mb-6">
        これまでSelection
        Commandをご利用いただきありがとうございました。お別れするのはとても残念ですが、今後の拡張機能の改善のため、以下のアンケートにご協力いただけますと幸いです。
      </p>
      <p className="mb-6">
        誤ってアンインストールされた場合は、Chrome
        ウェブストアから再インストールできます。
      </p>

      {submitStatus === 'success' ? (
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <p className="text-green-700 font-medium">
            ご回答ありがとうございました。貴重なご意見をいただき、誠にありがとうございます。
            このフォーム以外で直接ご意見をいただける場合は、ぜひ
            takeda.yujiro@gmail.com まで、件名を明記のうえご連絡ください。
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">
              アンインストールした理由を教えてください。(複数選択可能)
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

            <Collapsible open={selectedReasons.includes('other')}>
              <CollapsibleContent className={css.CollapsibleContent}>
                <div className="ml-6 mt-2">
                  <Input
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="具体的な理由をお聞かせください"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">
              よろしければ詳細を教えてください。
            </h2>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
              placeholder={`アンインストール理由の詳細、
やりたかったこと や 困ったこと、
使えなかったサイト等`}
            />
          </div>

          {submitStatus === 'error' && (
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-red-700">
                送信に失敗しました。時間をおいて再度お試しください。
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              type="submit"
              className="rounded-xl font-semibold bg-stone-700 px-8"
              disabled={selectedReasons.length === 0 || isSubmitting}
            >
              <Send className="mr-1" />
              {isSubmitting ? '送信中...' : '送信'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
