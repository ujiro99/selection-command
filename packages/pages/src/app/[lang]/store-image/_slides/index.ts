import { AiResultSlide } from "./AiResultSlide"
import { CustomizeSlide } from "./CustomizeSlide"
import { HeroSlide } from "./HeroSlide"
import { LinkPreviewSlide } from "./LinkPreviewSlide"
import { TriggerSlide } from "./TriggerSlide"
import { MarqueePromoTile, SmallPromoTile } from "./PromoTile"
import type { SlideProps } from "../_components/i18n"

type SlideEntry = {
  /** Shown in the gallery */
  title: string
  /** File name of the exported PNG; localized entries get a language prefix. */
  fileName: string
  Slide: (props: SlideProps) => JSX.Element
  /** Defaults to the screenshot dimensions (1280x800). */
  size?: { width: number; height: number }
  /** Promotional tiles use the same English artwork for every locale. */
  shared?: boolean
}

/** Store images in display order. The key is the URL segment. */
export const SLIDES: Record<string, SlideEntry> = {
  "1": { title: "Hero", fileName: "01_hero.png", Slide: HeroSlide },
  "2": { title: "Trigger", fileName: "02_trigger.png", Slide: TriggerSlide },
  "3": { title: "AI result", fileName: "03_ai.png", Slide: AiResultSlide },
  "4": {
    title: "Link preview",
    fileName: "04_link_preview.png",
    Slide: LinkPreviewSlide,
  },
  "5": {
    title: "Customize",
    fileName: "05_customize.png",
    Slide: CustomizeSlide,
  },
  promo: {
    title: "Small promotional tile",
    fileName: "promo.png",
    Slide: SmallPromoTile,
    size: { width: 440, height: 280 },
    shared: true,
  },
  marquee: {
    title: "Marquee promotional tile",
    fileName: "marquee.png",
    Slide: MarqueePromoTile,
    size: { width: 1400, height: 560 },
    shared: true,
  },
}

export function getSlideSize(key: string) {
  return SLIDES[key].size ?? { width: 1280, height: 800 }
}
