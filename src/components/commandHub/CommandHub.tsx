import React from 'react'
import { DownloadLink } from '@/components/commandHub/DownloadLink'
import { useForm } from '@/hooks/commandHub/useForm'

export const CommandHub = (): JSX.Element => {
  useForm()
  return (
    <>
      <DownloadLink />
    </>
  )
}
