import * as React from "react"
import { ChevronDown } from "lucide-react"
import type { Command, SearchCommand } from "@/types"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { OPEN_MODE } from "@/const"

type Props = {
  command: Command
  className?: string
}

export function Details(props: Props): JSX.Element {
  const { command: cmd } = props
  const isSearch = cmd.openMode !== OPEN_MODE.PAGE_ACTION

  return (
    <Popover>
      <PopoverTrigger>
        <ChevronDown
          className="p-0.5 text-stone-500 hover:bg-stone-200 rounded cursor-pointer"
          size={28}
        />
      </PopoverTrigger>
      <PopoverContent className="p-1 bg-inherit">
        <table className="w-full text-sm bg-stone-50 text-stone-700 rounded-md">
          <tbody>
            <tr>
              <td className="pl-3 pr-2 pt-2">Open Mode</td>
              <td className="pl-2 pr-3 pt-2">{cmd.openMode}</td>
            </tr>
            {isSearch && (
              <tr>
                <td className="pl-3 pr-2">┗ Ctrl + クリック</td>
                <td className="pl-2 pr-3">
                  {(cmd as SearchCommand).openModeSecondary}
                </td>
              </tr>
            )}
            {isSearch && (
              <tr>
                <td className="pl-3 pr-2 pb-2">スペースのエンコーディング</td>

                <td className="pl-2 pr-3 pb-2">
                  {(cmd as SearchCommand).spaceEncoding}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  )
}
