import { AiResultSlide } from "./AiResultSlide"
import { CustomizeSlide } from "./CustomizeSlide"
import { HeroSlide } from "./HeroSlide"
import { LinkPreviewSlide } from "./LinkPreviewSlide"
import { TriggerSlide } from "./TriggerSlide"
import type { SlideProps } from "../_components/i18n"

type SlideEntry = {
  /** Shown in the gallery */
  title: string
  /** File name of the exported PNG, after the language code */
  fileName: string
  Slide: (props: SlideProps) => JSX.Element
}

/** Store images in display order. The key is the URL segment. */
export const SLIDES: Record<string, SlideEntry> = {
  "1": { title: "Hero", fileName: "01_hero.png", Slide: HeroSlide },
  "2": { title: "Trigger", fileName: "02_trigger.png", Slide: TriggerSlide },
  "3": { title: "AI result", fileName: "03_ai.png", Slide: AiResultSlide },
  "4": {
    title: "Customize",
    fileName: "04_customize.png",
    Slide: CustomizeSlide,
  },
  "5": {
    title: "Link preview",
    fileName: "05_link_preview.png",
    Slide: LinkPreviewSlide,
  },
}
