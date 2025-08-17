"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/hooks/useLocale"
import { Labels } from "@/features/locale"

export function LocaleSelector(): JSX.Element {
  const { lang, switchLocale } = useLocale()

  return (
    <Select onValueChange={switchLocale} value={lang}>
      <SelectTrigger
        className={cn(
          "fixed gap-1 bottom-3 right-3 text-stone-700 text-sm lg:text-sm min-w-32 w-auto rounded-lg transition duration-50",
        )}
      >
        <Globe size={16} className="stroke-stone-600" />
        <SelectValue placeholder="Languages" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Object.entries(Labels).map(([key, name]) => (
            <SelectItem value={key} key={key}>
              {name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
