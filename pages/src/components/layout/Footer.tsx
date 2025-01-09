import Link from 'next/link'
import data from '@/data/analytics.json'
import { Separator } from '@/components/ui/separator'
import { LocaleSelector } from '@/components/LocaleSelector'
import { LangProps } from '@/types'
import { getDict } from '@/features/locale'

type Props = LangProps

export function Footer(props: Props): JSX.Element {
  const { lang } = props
  const t = getDict(lang).about
  const { updated } = data
  const updatedDate = new Date(updated)
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
        <p className="text-center">
          <span>© 2024 Selection Command</span>
          <br />
          <span className="text-stone-500 text-xs" data-updated={updated}>
            Last Updated: {updatedDate.toLocaleDateString(lang)}
          </span>
        </p>
      </div>
      <LocaleSelector />
    </footer>
  )
}
