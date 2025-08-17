import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowUpToLine } from "lucide-react"
import { CommandForm } from "@/components/CommandForm"
import { LangProps } from "@/types"
import { getDict } from "@/features/locale"

export function CommandShare(props: LangProps): JSX.Element {
  const { lang } = props
  const t = getDict(lang).commandShare
  return (
    <Dialog>
      <DialogTrigger className="flex items-center px-4 py-1.5 sm:h-10 h-8 rounded-full bg-stone-700 text-primary-foreground shadow hover:bg-primary/90 outline-none transition">
        <ArrowUpToLine size={18} />
        <span className="sm:ml-1.5 ml-0.5 font-semibold text-xs sm:text-sm">
          {t.title}
        </span>
      </DialogTrigger>
      <DialogContent id="CommandShare" className="bg-stone-50">
        <DialogTitle>
          <span className="mr-1">✏️</span>
          {t.formTitle}
        </DialogTitle>
        <CommandForm />
      </DialogContent>
    </Dialog>
  )
}
