import React from 'react'
import { ArrowDownToLine, Check, Star, Zap, Search } from 'lucide-react'
import { Image } from '@/components/Image'
import { TagLink } from '@/components/TagLink'
import type { Command } from '@/types'
import { cmd2text } from '@/features/command'
import { isSearchCommand, isPageActionCommand } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { StepList } from '@/components/pageAction/StepList'

type Props = {
  cmd: Command
}

export function ListItem(props: Props): JSX.Element {
  const { cmd } = props
  const isSearch = isSearchCommand(cmd)
  const isPageAction = isPageActionCommand(cmd)

  return (
    <>
      <div className="text-left flex flex-row items-center gap-1">
        <div className="flex-1 overflow-hidden space-y-1">
          <p className="text-lg flex flex-row items-center gap-2 text-stone-700">
            <Image
              src={cmd.iconUrl}
              alt={cmd.title}
              className="inline-block w-7 h-7"
            />
            <span>{cmd.title}</span>
            <Tooltip
              render={() => (
                <p>{isSearch ? 'Search Command' : 'Page Action Command'}</p>
              )}
            >
              {isSearch ? (
                <Search
                  size={18}
                  className="ml-1 stroke-stone-400 drop-shadow"
                />
              ) : (
                <Zap size={18} className="ml-1 stroke-stone-400" />
              )}
            </Tooltip>
          </p>
          <p className="text-xs sm:text-sm text-stone-500 truncate">
            {isSearch ? cmd.searchUrl : cmd.pageActionOption.startUrl}
          </p>
          <p className="text-md sm:text-base">{cmd.description}</p>
          {isPageAction && (
            <StepList
              className="ml-[-1rem] py-1"
              steps={cmd.pageActionOption.steps}
            />
          )}
        </div>
        <div className="flex gap-1">
          {/* Download */}
          <div className="flex items-center text-stone-700">
            <div>
              <p className="hidden" data-id={cmd.id}>
                <Check className="p-1 stroke-sky-500" size={28} />
              </p>
              <button
                className="cursor-default block rounded transition duration-50 group data-clickable:clickable-button"
                data-id={cmd.id}
                data-command={cmd2text(cmd)}
                data-gtm-click="install"
                data-clickable="false"
              >
                <ArrowDownToLine
                  className="p-1 stroke-stone-400 group-data-clickable:clickable-svg"
                  size={28}
                />
              </button>
            </div>
            <span
              className="pl-0.5 p-1 text-stone-500 select-none"
              data-id={cmd.id}
              data-download-count={cmd.download}
            >
              {cmd.download.toLocaleString()}
            </span>
          </div>

          {/* Star */}
          <div className="flex items-center text-stone-600">
            <button
              className="cursor-default block rounded transition duration-50 group data-clickable:clickable-button"
              data-star-id={cmd.id}
              data-gtm-click="star"
            >
              <Star
                className="p-1 stroke-stone-400 group-data-clickable:clickable-svg group-data-starred:starred"
                size={28}
              />
            </button>
            <span
              className="pl-0.5 p-1 text-stone-500 select-none "
              data-star-id={cmd.id}
              data-star-count={cmd.star}
            >
              {cmd.star.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <ul className="mt-2 flex gap-2 flex-wrap">
        {cmd.tags.map((tag) => (
          <li key={tag.id}>
            <TagLink tag={tag} />
          </li>
        ))}
      </ul>
    </>
  )
}
