import data from '@/data/analytics.json'
import { LocaleSelector } from '@/components/LocaleSelector'

export function Footer(): JSX.Element {
  const { updated } = data
  const updatedDate = new Date(updated)
  return (
    <footer className="row-start-3 flex flex-col gap-3 items-center">
      <p className="text-stone-500 text-sm" data-updated={updated}>
        Last Updated: {updatedDate.toLocaleDateString()}
      </p>
      <p className="text-stone-500">© 2024 Selection Command</p>
      <LocaleSelector />
    </footer>
  )
}
