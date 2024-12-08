import * as React from 'react'
import clsx from 'clsx'
import type { Command } from '@/types'

import css from '@/app/page.module.css'

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'

type Props = {
  command: Command
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

export function Details(props: Props): JSX.Element {
  const { command: cmd } = props
  return (
    <Collapsible
      {...props}
      className={clsx('flex flex-col items-end', props.className)}
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      <CollapsibleContent className={clsx('w-full mt-1 p-2', css.details)}>
        <table className="w-full text-sm text-stone-700 bg-stone-200 rounded-md">
          <tbody>
            <tr>
              <td className="pl-3 pr-2 pt-2">Open Mode</td>
              <td className="pl-2 pr-3 pt-2">{cmd.openMode}</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2">┗ Ctrl + クリック</td>
              <td className="pl-2 pr-3">{cmd.openModeSecondary}</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 pb-2">スペースのエンコーディング</td>
              <td className="pl-2 pr-3 pb-2">{cmd.spaceEncoding}</td>
            </tr>
          </tbody>
        </table>
      </CollapsibleContent>
    </Collapsible>
  )
}
