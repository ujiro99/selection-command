import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CommandList } from '@/components/layout/CommandList'
import { CommandShare } from '@/components/CommandShare'
import css from '@/app/page.module.css'
import { DefaultLanguage } from '@/features/locale'

export default function Home() {
  const lang = DefaultLanguage
  return (
    <div className={css.container}>
      <Header lang={lang} />
      <main className={css.main}>
        <div className={css.menu}>
          <div />
          <CommandShare lang={lang} />
        </div>
        <CommandList lang={lang} />
      </main>
      <Footer />
    </div>
  )
}
