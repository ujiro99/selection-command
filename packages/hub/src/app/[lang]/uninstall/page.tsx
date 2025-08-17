import { UninstallForm } from "@/components/UninstallForm"

import css from "@/app/page.module.css"

export default async function UninstallPage() {
  return (
    <main className={css.main}>
      <UninstallForm />
    </main>
  )
}
