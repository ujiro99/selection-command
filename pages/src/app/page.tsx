import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CommandList } from '@/components/layout/CommandList'
import { CommandShare } from '@/components/CommandShare'
import css from './page.module.css'

export default function Home() {
  return (
    <div className={css.container}>
      <Header />
      <main className={css.main}>
        <div className="w-full flex justify-end">
          <CommandShare />
        </div>
        <CommandList />
      </main>
      <Footer />
    </div>
  )
}
