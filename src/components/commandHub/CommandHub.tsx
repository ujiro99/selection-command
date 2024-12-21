import React from 'react'
import { DownloadButton } from '@/components/commandHub/DownloadButton'
import { StarButton } from '@/components/commandHub/StarButton'

export const CommandHub = (): JSX.Element => {
  return (
    <>
      <DownloadButton />
      <StarButton />
    </>
  )
}
