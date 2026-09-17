import { useState } from "react"
import { Info } from "lucide-react"
import { Tooltip } from "@/components/Tooltip"

type InfoTooltipProps = {
  /** Explanation shown while the icon is hovered. */
  text: string
  /** Set it when a test or e2e flow needs to reach this particular icon. */
  testId?: string
}

/**
 * Info icon next to a field label that reveals its explanation on hover, for
 * text that would be too long to sit under the label.
 */
export const InfoTooltip = ({ text, testId }: InfoTooltipProps) => {
  // A state-backed ref, so the Tooltip re-renders once its anchor exists.
  const [triggerElm, setTriggerElm] = useState<HTMLSpanElement | null>(null)

  return (
    <>
      <span
        ref={setTriggerElm}
        data-testid={testId}
        className="cursor-pointer p-1 rounded hover:bg-gray-100 transition-background"
      >
        <Info className="size-4 text-foreground/60" />
      </span>
      <Tooltip
        positionElm={triggerElm}
        text={text}
        className="max-w-64 whitespace-pre-wrap"
        delay={200}
      />
    </>
  )
}
