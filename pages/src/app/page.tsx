import clsx from 'clsx'
import { MousePointer, ChevronDown } from 'lucide-react'
import { Image } from '@/components/Image'
import { Badge } from '@/components/ui/badge'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import { getCommands } from '@/services/util'
import css from './page.module.css'

export default function Home() {
  const commands = getCommands()

  return (
    <div className="grid grid-rows-[20px_1fr_20px] justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="flex items-center gap-1.5 text-3xl font-[family-name:var(--font-geist-mono)] font-medium">
        Selection <span className="bg-[#1597C9]/20 px-2 rounded">Command</span>
        <span className="font-extralight ml-1">Hub</span>
        <MousePointer className={css.mouse} size={26} />
      </header>
      <main className="flex flex-col gap-8 mt-8 row-start-2 sm:items-start">
        <ul className="text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          {commands.map((cmd) => (
            <li key={cmd.id} className={clsx('py-4', css.item)}>
              <div className="text-left">
                <p className="text-lg flex flex-row">
                  <Image
                    src={cmd.iconUrl}
                    alt={cmd.title}
                    className="inline-block w-7 h-7 mr-2"
                  />
                  {cmd.title}
                </p>
                <p className="text-stone-500 text-sm">{cmd.searchUrl}</p>
                <p className="">{cmd.description}</p>

                <Collapsible className="flex flex-col items-end	mt-[-8px]">
                  <CollapsibleTrigger className="flex text-stone-500 hover:bg-stone-200 rounded">
                    <ChevronDown />
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    className={clsx('w-full mt-1', css.details)}
                  >
                    <table className="w-full text-sm text-stone-600 bg-stone-100 rounded">
                      <tbody>
                        <tr>
                          <td className="pl-3 pr-2 pt-1">Open Mode</td>
                          <td className="pl-2 pr-3 pt-1">{cmd.openMode}</td>
                        </tr>
                        <tr>
                          <td className="pl-3 pr-2">┗ Ctrl + クリック</td>
                          <td className="pl-2 pr-3">{cmd.openModeSecondary}</td>
                        </tr>
                        <tr>
                          <td className="pl-3 pr-2 pb-1">
                            スペースのエンコーディング
                          </td>
                          <td className="pl-2 pr-3 pb-1">
                            {cmd.spaceEncoding}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </CollapsibleContent>
                </Collapsible>
                <ul className="mt-2 flex gap-2">
                  {cmd.tags.map((tag) => (
                    <li key={tag.id}>
                      <Badge className="bg-stone-200 hover:bg-stone-300 text-stone-800">
                        {tag.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        © 2024 Selection Command
      </footer>
    </div>
  )
}
