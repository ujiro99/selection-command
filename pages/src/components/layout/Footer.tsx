import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { LocaleSelector } from '@/components/LocaleSelector'
import { LangProps } from '@/types'
import { getDict } from '@/features/locale'

type Props = LangProps

export function Footer(props: Props): JSX.Element {
  const { lang } = props
  const t = getDict(lang).about
  return (
    <footer className="w-full mt-8">
      <Separator />
      <div className="flex flex-col gap-4 items-center py-8 text-stone-500">
        <div className="flex gap-2 text-sm">
          <Link href={`/${lang}/terms`} className="hover:text-stone-800">
            {t.terms}
          </Link>
          <Separator orientation="vertical" className="h-[1.5em]" />
          <Link href={`/${lang}/privacy`} className="hover:text-stone-800">
            {t.privacy}
          </Link>
          <Separator orientation="vertical" className="h-[1.5em]" />
          <Link href={`/${lang}/cookie`} className="hover:text-stone-800">
            {t.cookie}
          </Link>
        </div>
        <p>© 2024 Selection Command</p>
      </div>
      <LocaleSelector />
    </footer>
  )
}
