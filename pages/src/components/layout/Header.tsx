import Link from 'next/link'
import { Ribbon } from '@/components/Ribbon'
import { Store, MousePointer } from 'lucide-react'
import css from './Header.module.css'
import commonCss from '@/lib/common.module.css'

export function Header(): JSX.Element {
  return (
    <div>
      <Link href="/" className={commonCss.hover}>
        <header className="flex items-center gap-1.5 text-3xl font-[family-name:var(--font-geist-mono)] font-medium">
          Selection{' '}
          <span className="bg-[#1597C9]/20 px-2 py-0.5 rounded-lg">
            Command
          </span>
          <span className="font-extralight ml-1">Hub</span>
          <MousePointer className={css.mouse} size={26} />
        </header>
      </Link>
      <Ribbon className="drop-shadow">
        <a
          href="https://chromewebstore.google.com/detail/selection-command/nlnhbibaommoelemmdfnkjkgoppkohje"
          target="_blank"
          className="px-2 py-3 inline-block text-center text-md font-[family-name:var(--font-geist-mono)] font-medium leading-6"
          data-gtm-click="chrome-web-store"
        >
          <Store size={16} className="inline mr-1" />
          Install
          <br /> Extension
        </a>
      </Ribbon>
    </div>
  )
}
