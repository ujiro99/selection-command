import Link from 'next/link'
import { Image } from '@/components/Image'
import { MousePointer } from 'lucide-react'
import css from './Header.module.css'
import commonCss from '@/lib/common.module.css'
import { LangProps } from '@/types'

type Props = LangProps

export function Header(props: Props): JSX.Element {
  const { lang } = props
  return (
    <div>
      <Link href={`/${lang}`} className={commonCss.hover}>
        <header className="relative flex items-center sm:gap-1.5 gap-0.5 text-xl sm:text-3xl font-[family-name:var(--font-geist-mono)] font-medium">
          Selection{' '}
          <span className="bg-[#1597C9]/20 px-1.5 sm:px-2 pb-0.5 sm:py-0.5 rounded-lg">
            Command
          </span>
          <span className="font-extralight ml-1">Hub</span>
          <MousePointer className={css.mouse} size={26} />
        </header>
      </Link>
      <a
        href="https://chromewebstore.google.com/detail/selection-command/nlnhbibaommoelemmdfnkjkgoppkohje"
        target="_blank"
        className="fixed top-2 right-2 bg-white border border-stone-200 rounded-lg shadow-md transition duration-200 hover:shadow-lg hidden sm:block z-10"
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
