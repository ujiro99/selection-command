import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CommandList } from '@/components/layout/CommandList'
import { CommandShare } from '@/components/CommandShare'
import css from './page.module.css'

export default function Home() {
  return (
    <div className={css.container}>
      <Header />
      <main className="w-[600px] flex flex-col gap-8 mt-8 row-start-2 sm:items-start">
        <div className="w-full flex justify-end">
          <CommandShare />
        </div>
        <CommandList />
      </main>
      <Footer />
    </div>
  )
}
