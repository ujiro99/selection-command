import Link from 'next/link'
import { MousePointer } from 'lucide-react'
import css from './Header.module.css'
import commonCss from '@/lib/common.module.css'

export function Header(): JSX.Element {
  return (
    <Link href="/" className={commonCss.hover}>
      <header className="flex items-center gap-1.5 text-3xl font-[family-name:var(--font-geist-mono)] font-medium">
        Selection{' '}
        <span className="bg-[#1597C9]/20 px-2 py-0.5 rounded-lg">Command</span>
        <span className="font-extralight ml-1">Hub</span>
        <MousePointer className={css.mouse} size={26} />
      </header>
    </Link>
  )
}
