import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowUpToLine } from 'lucide-react'
import { CommandForm } from '@/components/CommandForm'

export function CommandShare(): JSX.Element {
  return (
    <Dialog>
      <DialogTrigger className="flex items-center px-4 py-1.5 sm:h-10 h-8 rounded-full bg-stone-700 text-primary-foreground shadow hover:bg-primary/90 outline-none transition">
        <ArrowUpToLine size={18} />
        <span className="sm:ml-1.5 ml-0.5 font-semibold text-xs sm:text-sm">
          コマンド共有
        </span>
      </DialogTrigger>
      <DialogContent id="CommandShare" className="bg-stone-50">
        <DialogTitle className="text-stone-600">
          <span className="mr-1">✏️</span>コマンド共有フォーム
        </DialogTitle>
        <CommandForm />
      </DialogContent>
    </Dialog>
  )
}
