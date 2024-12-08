import clsx from 'clsx'
import { MousePointer } from 'lucide-react'

import { ListItem } from '@/components/ListItem'
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
      <main className="w-[600px] flex flex-col gap-8 mt-8 row-start-2 sm:items-start">
        <ul className="w-full text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          {commands.map((cmd) => (
            <li key={cmd.id} className={clsx('px-2', css.item)}>
              <ListItem cmd={cmd} />
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
