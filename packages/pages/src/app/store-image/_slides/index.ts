import { AiPromptSlide } from "./AiPromptSlide"
import { CustomizeSlide } from "./CustomizeSlide"
import { HeroSlide } from "./HeroSlide"
import { LinkPreviewSlide } from "./LinkPreviewSlide"
import { PageActionSlide } from "./PageActionSlide"

/** Store images in display order. The key is the URL segment. */
export const SLIDES: Record<
  string,
  { title: string; Slide: () => JSX.Element }
> = {
  "1": { title: "概要", Slide: HeroSlide },
  "2": { title: "AIプロンプト", Slide: AiPromptSlide },
  "3": { title: "カスタマイズ", Slide: CustomizeSlide },
  "4": { title: "リンクプレビュー", Slide: LinkPreviewSlide },
  "5": { title: "ページアクション", Slide: PageActionSlide },
}
