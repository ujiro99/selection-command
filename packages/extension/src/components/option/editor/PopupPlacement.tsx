import { ChevronRight } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  PopupPlacementField,
  PopupPlacementFieldType,
} from "@/components/option/field/PopupPlacementField"

import { cn } from "@/lib/utils"
import { t as _t } from "@/services/i18n"
const t = (key: string, p?: string[]) => _t(`Option_${key}`, p)

import collapsibleCss from "@/components/ui/collapsible.module.css"

export const PopupPlacement = (param: PopupPlacementFieldType) => {
  return (
    <Collapsible className={cn(collapsibleCss.collapse, "flex flex-col")}>
      <CollapsibleTrigger className="flex items-center hover:bg-gray-100 -ml-2 px-2 h-[40px] rounded-lg text-sm font-semibold self-start transition">
        <span className="mr-1">{t("popupPlacement")}</span>
        <ChevronRight size={18} className={cn(collapsibleCss.iconRight)} />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(collapsibleCss.CollapsibleContent, "w-full py-4")}
      >
        <PopupPlacementField {...param} />
      </CollapsibleContent>
    </Collapsible>
  )
}
