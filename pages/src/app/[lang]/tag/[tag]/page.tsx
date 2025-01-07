import Link from 'next/link'
import { House, ChevronLeft } from 'lucide-react'
import { CommandList } from '@/components/layout/CommandList'
import { CommandShare } from '@/components/CommandShare'
import { cn } from '@/lib/utils'
import { LangProps } from '@/types'
import css from '@/app/page.module.css'
import commonCss from '@/lib/common.module.css'

import { getTags } from '@/features/tag'

export function generateStaticParams() {
  const tags = getTags()
  return tags.map((tag) => ({ tag: tag.name }))
}

type Props = LangProps & { tag: string }

export default async function Page({ params }: { params: Promise<Props> }) {
  let { lang, tag } = await params
  tag = decodeURI(tag)
  return (
    <main className={css.main}>
      <div className={css.menu}>
        <div>
          <Link href={`/${lang}`} className={cn(css.topLink, commonCss.hover)}>
            <ChevronLeft className="inline" />
            <House className="inline" size={16} />
            <span className="ml-0.5">Top</span>
          </Link>
          <h1 className="text-xl sm:text-3xl text-bold mt-1 sm:mt-2 indent-1 font-[family-name:var(--font-geist-mono)]">
            #<span className="ml-0.5">{tag}</span>
          </h1>
        </div>
        <CommandShare lang={lang} />
      </div>
      <CommandList tagName={tag} />
    </main>
  )
}
