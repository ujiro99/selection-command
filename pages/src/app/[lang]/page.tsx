import { CommandList } from '@/components/layout/CommandList'
import { CommandShare } from '@/components/CommandShare'
import { LangProps } from '@/types'

import css from '@/app/page.module.css'

export default async function Page({ params }: { params: Promise<LangProps> }) {
  let { lang } = await params
  return (
    <main className={css.main}>
      <div className={css.menu}>
        <div />
        <CommandShare lang={lang} />
      </div>
      <CommandList lang={lang} />
    </main>
  )
}
