'use client'

import React, { useState } from 'react'
import clsx from 'clsx'
import { Send, Undo2 } from 'lucide-react'

import { InputForm, FormValues } from '@/components/InputForm'
import { Button } from '@/components/ui/button'
import { DialogDescription } from '@/components/ui/dialog'
import { Image } from '@/components/Image'
import { StepList } from '@/components/pageAction/StepList'

import { useLocale } from '@/hooks/useLocale'
import { cmd2uuid } from '@/features/command'
import type { CommandInJson, Tag as TagType } from '@/types'
import { isSearchCommand, isPageActionCommand } from '@/lib/utils'

import css from './CommandForm.module.css'

const STORAGE_KEY = 'CommandShareFormData'

const toMessages = (data: FormValues) => {
  const msgObj = toCommand(data)
  return `\`\`\`\n${JSON.stringify(msgObj, null, 2)}`
}

const toCommand = (data: FormValues): CommandInJson => {
  const tags = data.tags.map((t) => t.name)
  return {
    ...data,
    id: cmd2uuid(data),
    addedAt: new Date().toISOString(),
    tags,
  }
}

const enum STEP {
  INPUT,
  CONFIRM,
  SENDING,
  COMPLETE,
  ERROR,
}

export function CommandForm() {
  const [formData, setFormData] = useState<FormValues>({} as FormValues)
  const [step, setStep] = useState<STEP>(STEP.INPUT)

  const onInputSubmit = (values: FormValues) => {
    if (!values) return
    setFormData(values)
    setStep(STEP.CONFIRM)
  }

  const onConfirmSubmit = () => {
    setStep(STEP.SENDING)
    // Send data to Google Apps Script
    const url =
      'https://script.google.com/macros/s/AKfycbxhdkl8vb0mxDlKqiHlF1ND461sIVp7nenuKOuNP4Shq1xMgvWyRQsg5Dl2Z0eRnxE/exec'
    const submit = async () => {
      try {
        const ret = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'no-cors',
          body: JSON.stringify({
            title: formData.title,
            message: toMessages(formData),
          }),
        })
        console.debug(ret)
        // Clear localStorage after form submission
        sessionStorage.removeItem(STORAGE_KEY)
        setStep(STEP.COMPLETE)
      } catch (e) {
        console.error(e)
        setStep(STEP.ERROR)
      }
    }
    submit()
  }

  const onBack = () => {
    setStep(STEP.INPUT)
  }

  switch (step) {
    case STEP.INPUT:
      return <InputForm onFormSubmit={onInputSubmit} />
    case STEP.CONFIRM:
      return (
        <ConfirmForm
          data={formData}
          onBack={onBack}
          onFormSubmit={onConfirmSubmit}
        />
      )
    case STEP.SENDING:
      return <SendingForm />
    case STEP.COMPLETE:
      return <CompleteForm />
    case STEP.ERROR:
      return <ErrorForm />
    default:
      return null
  }
}

const Item = ({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) => (
  <div className="flex items-center min-h-7">
    <label className="w-2/6 text-sm font-medium">{label}</label>
    <div
      className={clsx(
        'w-4/6 font-[family-name:var(--font-geist-mono)] text-sm leading-relaxed overflow-x-auto whitespace-nowrap inline-block',
        valueClass,
      )}
    >
      <span>{value}</span>
    </div>
  </div>
)

const IconItem = ({ label, value }: { label: string; value: string }) => (
  <div className="relative">
    <Image
      className="absolute top-[-2px] left-[27%] w-7 h-7 rounded"
      src={value}
      alt="Search url's favicon"
    />
    <Item label={label} value={value} />
  </div>
)

type TagName = Omit<TagType, 'id'>
const tagNames = (tags: TagName[]) => tags.map((t) => t.name).join(', ')

type ConfirmProps = {
  data: FormValues
  onFormSubmit: () => void
  onBack: () => void
}

function ConfirmForm(props: ConfirmProps) {
  const { dict } = useLocale()
  const t = dict.inputForm
  const t2 = dict.confirmForm
  const cmd = props.data

  const isSearch = isSearchCommand(cmd)
  const isPageAction = isPageActionCommand(cmd)

  return (
    <div id="ConfirmForm" className="overflow-auto">
      <DialogDescription className="text-stone-600">
        {t2.formDescription}
      </DialogDescription>

      <div className="mt-3 px-4 py-3 text-stone-800 bg-stone-200 rounded-xl">
        <Item label={t.title.label} value={props.data.title} />
        {isSearch && <Item label={t.searchUrl.label} value={cmd.searchUrl} />}
        {isPageAction && (
          <Item
            label={t.searchUrl.label}
            value={cmd.pageActionOption.startUrl}
          />
        )}
        <Item
          label={t.description.label}
          value={cmd.description}
          valueClass="whitespace-break-spaces break-words"
        />
        <IconItem label={t.iconUrl.label} value={cmd.iconUrl} />
        <Item label={t.tags.label} value={tagNames(cmd.tags)} />
        <Item
          label={t.openMode.label}
          value={t.openMode.options[cmd.openMode]}
        />
        {isSearch && (
          <>
            <Item
              label={t.openModeSecondary.label}
              value={t.openMode.options[cmd.openModeSecondary]}
            />
            <Item
              label={t.spaceEncoding.label}
              value={t.spaceEncoding.options[cmd.spaceEncoding]}
            />
          </>
        )}
        {isPageAction && (
          <div>
            <label className="w-2/6 text-sm font-medium">
              {t.pageAction.label}
            </label>
            <StepList className="py-3" steps={cmd.pageActionOption.steps} />
          </div>
        )}
      </div>
      <p className="mt-3 text-md text-center whitespace-break-spaces">
        {t2.caution}
      </p>
      <div className="mt-5 text-center">
        <Button
          className="rounded-xl font-semibold text-stone-700 bg-stone-300 hover:bg-stone-300/80"
          onClick={props.onBack}
          data-gtm-click="confirm-back"
        >
          <Undo2 />
          {t2.back}
        </Button>
        <Button
          type="submit"
          className="rounded-xl font-semibold bg-stone-700 ml-6"
          onClick={props.onFormSubmit}
        >
          <Send />
          {t2.submit}
        </Button>
      </div>
    </div>
  )
}

function SendingForm() {
  const t = useLocale().dict.SendingForm
  return (
    <div id="SendingForm" className="flex items-center justify-center flex-col">
      <DialogDescription className="text-stone-600">
        {t.sending}
      </DialogDescription>
      <Image
        src="/bars-scale-middle.svg"
        alt="Uploading..."
        width={30}
        height={30}
        className="opacity-60 my-5"
      />
    </div>
  )
}

function CompleteForm() {
  const { dict } = useLocale()
  const t = dict.completeForm
  return (
    <div id="CompleteForm">
      <DialogDescription className="text-stone-600 text-lg">
        {t.formDescription}
        <span className="ml-1 text-xl">🎉</span>
      </DialogDescription>
      <div className="flex items-center mt-3">
        <p
          className={clsx(
            'flex-1 bg-stone-200 rounded-2xl px-5 py-3 whitespace-break-spaces',
            css.triangle,
          )}
        >
          {t.thanks}
        </p>
        <Image
          src="/engineer_suit_simple.png"
          alt="Engineer"
          width={100}
          height={100}
          className="rounded-full bg-stone-200 ml-3 h-[100px]"
          style={
            {
              objectViewBox: 'inset(-5% 8% 47% 38%)',
            } as React.CSSProperties
          }
        />
      </div>
      <p className="mt-5 text-md">{t.aboudDelete}</p>
      <a
        className="underline text-sky-600"
        href="https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support"
        target="_brank"
        data-gtm-click="support-on-complete"
      >
        {t.supportHub}
      </a>
    </div>
  )
}

function ErrorForm() {
  const t = useLocale().dict.errorForm
  return (
    <div id="ErrorForm">
      <DialogDescription className="text-stone-600 text-lg">
        {t.formDescription}
      </DialogDescription>
      <div className="mt-3 gap-2 flex flex-col">
        <p className="text-md whitespace-break-spaces">{t.message}</p>
        <a
          className="underline text-sky-600"
          href="https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support"
          target="_brank"
          data-gtm-click="support-on-error"
        >
          {t.supportHub}
        </a>
      </div>
    </div>
  )
}
