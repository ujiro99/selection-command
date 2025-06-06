import { UninstallForm } from '@/components/UninstallForm'
import { LangProps } from '@/types'

import css from '@/app/page.module.css'

export default async function UninstallPage({
  params,
}: {
  params: Promise<LangProps>
}) {
  return (
    <main className={css.main}>
      <UninstallForm />
    </main>
  )
}
