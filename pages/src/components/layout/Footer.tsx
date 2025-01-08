import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { LocaleSelector } from '@/components/LocaleSelector'
import { LangProps } from '@/types'

type Props = LangProps

export function Footer(props: Props): JSX.Element {
  const { lang } = props
  return (
    <footer className="w-full mt-8">
      <Separator />
      <div className="flex flex-col gap-4 items-center py-8 text-stone-500">
        <div className="flex gap-2 text-sm">
          <Link href={`${lang}/terms`} className="hover:text-stone-800">
            利用規約
          </Link>
          <Separator orientation="vertical" className="h-[1.5em]" />
          <Link href={`${lang}/privacy`} className="hover:text-stone-800">
            プライバシーポリシー
          </Link>
          <Separator orientation="vertical" className="h-[1.5em]" />
          <Link href={`${lang}/cookie`} className="hover:text-stone-800">
            Cookieポリシー
          </Link>
        </div>
        <p>© 2024 Selection Command</p>
      </div>
      <LocaleSelector />
    </footer>
  )
}
