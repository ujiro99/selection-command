import Link from 'next/link'
import { Image } from '@/components/Image'
import { MousePointer } from 'lucide-react'
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
      <a
        href="https://chromewebstore.google.com/detail/selection-command/nlnhbibaommoelemmdfnkjkgoppkohje"
        target="_blank"
        className="fixed top-2 right-2 bg-white border border-stone-200 rounded-lg shadow-md transition duration-200 hover:shadow-lg"
        data-gtm-click="chrome-web-store"
      >
        <Image
          src="/chrome_web_store.png"
          alt="Chrome Web Store"
          width={200}
          height={60}
          loading="lazy"
        />
      </a>
    </div>
  )
}
