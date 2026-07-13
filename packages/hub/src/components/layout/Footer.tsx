import { Separator } from "@/components/ui/separator"
import { LocaleSelector } from "@/components/LocaleSelector"

export function Footer(): JSX.Element {
  return (
    <footer className="w-full mt-8">
      <Separator />
      <div className="flex flex-col gap-4 items-center py-8 text-stone-500">
        <p className="text-center">
          <span>© 2024 Selection Command</span>
        </p>
      </div>
      <LocaleSelector />
    </footer>
  )
}
