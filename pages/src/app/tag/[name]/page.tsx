import Link from 'next/link'
import { House, ChevronLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CommandList } from '@/components/layout/CommandList'
import { CommandShare } from '@/components/CommandShare'
import { cn } from '@/lib/utils'
import css from '@/app/page.module.css'
import commonCss from '@/lib/common.module.css'

import { getTags } from '@/features/tag'

export function generateStaticParams() {
  const tags = getTags()
  const paths = tags.map((tag) => ({ name: tag.name }))
  return paths
}

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  let { name } = await params
  name = decodeURI(name)
  return (
    <div className={css.container}>
      <Header />
      <main className={css.main}>
        <div className={css.menu}>
          <div>
            <Link href="/" className={cn(css.topLink, commonCss.hover)}>
              <ChevronLeft className="inline" />
              <House className="inline" size={16} />
              <span className="ml-0.5">Top</span>
            </Link>
            <h1 className="text-3xl text-bold mt-2 indent-1 font-[family-name:var(--font-geist-mono)]">
              #<span className="ml-0.5">{name}</span>
            </h1>
          </div>
          <CommandShare />
        </div>
        <CommandList tagName={name} />
      </main>
      <Footer />
    </div>
  )
}
