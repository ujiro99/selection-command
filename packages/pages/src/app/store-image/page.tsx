import type { Metadata } from "next"
import {
  ArrowUpRight,
  Bot,
  EllipsisVertical,
  Globe,
  Languages,
  MonitorPlay,
  Search,
  Sparkle,
  Zap,
  type LucideIcon,
} from "lucide-react"

import css from "./page.module.css"

// Commands shown in the mock menu bar, left to right. The first one is hovered.
const MENU_ICONS: LucideIcon[] = [
  Search,
  Bot,
  Languages,
  Globe,
  MonitorPlay,
  Zap,
  EllipsisVertical,
]

export const metadata: Metadata = {
  title: "Store Image | Selection Command",
  robots: { index: false, follow: false },
}

/**
 * Promotional image for the Chrome Web Store (1280x800).
 * Open this page with a 1280x800 viewport and take a screenshot.
 */
export default function StoreImagePage(): JSX.Element {
  return (
    <main className={css.canvas}>
      <div className={css.glow} aria-hidden />

      {/* Left column: brand + copy */}
      <section className={css.copy}>
        <div className={css.brand}>
          <span className={css.brandIcon}>
            <ArrowUpRight size={20} strokeWidth={3} />
          </span>
          <span className={css.brandName}>Selection Command</span>
        </div>

        <p className={css.eyebrow}>CHROME EXTENSION</p>

        <h1 className={css.headline}>
          <span>気になる言葉から、</span>
          <span className={css.headlineAccent}>検索もAIもすぐ実行。</span>
        </h1>

        <p className={css.lead}>
          コピーして、タブを開いて、貼り付ける。
          <br />
          その手間をなくそう。
        </p>

        <ul className={css.chips}>
          <li className={css.chip}>
            <Search size={14} strokeWidth={2.6} className={css.chipIcon} />
            検索
          </li>
          <li className={css.chip}>
            <Sparkle size={15} strokeWidth={2.2} className={css.chipIcon} />
            AIに聞く
          </li>
          <li className={css.chip}>
            <span className={css.chipGlyph}>文</span>
            翻訳
          </li>
        </ul>
      </section>

      {/* Right column: browser mockup */}
      <div className={css.scene} aria-hidden>
        <div className={css.browser}>
          <div className={css.toolbar}>
            <span className={css.dots}>
              <i />
              <i />
              <i />
            </span>
            <span className={css.address}>example.com / article</span>
          </div>

          <div className={css.article}>
            <p className={css.articleLabel}>ARTICLE · RESEARCH</p>
            <p className={css.articleTitle}>情報をもっと、スムーズに。</p>
            <div className={css.line} style={{ width: 548 }} />
            <div className={css.line} style={{ width: 502 }} />
            <p className={css.articleText}>
              新しいアイデアを探すとき、
              <br />
              <mark className={css.selected}>ユーザー体験</mark>を調べる。
            </p>
            <div className={css.line} style={{ width: 548 }} />
            <div className={css.line} style={{ width: 470 }} />
          </div>
        </div>

        {/* Command popup shown on text selection */}
        {/* Icon-only menu bar, modeled after the extension's actual popup */}
        <div className={css.popup}>
          {MENU_ICONS.map((Icon, index) => (
            <span
              key={index}
              className={
                index === 0
                  ? `${css.menuItem} ${css.menuItemActive}`
                  : css.menuItem
              }
            >
              <Icon strokeWidth={1.75} className={css.menuIcon} />
            </span>
          ))}
        </div>

        <svg
          className={css.cursor}
          width="34"
          height="42"
          viewBox="0 0 34 42"
          fill="none"
        >
          <path
            d="M3 2.5 L3 33 L11 25.5 L16.5 38.5 L22 36 L16.8 23.5 L28 23.5 Z"
            fill="#fff"
            stroke="#1e293b"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </svg>

        {/* Result tooltip */}
        <div className={css.tooltip}>
          <ArrowUpRight size={22} strokeWidth={3} className={css.tooltipIcon} />
          <div>
            <p className={css.tooltipTitle}>選択した言葉で検索</p>
            <p className={css.tooltipSub}>コピー不要</p>
          </div>
        </div>
      </div>

      <p className={css.tagline}>
        Select text. Run commands. Get there faster.
      </p>
      <p className={css.signature}>SELECTION → COMMAND</p>
    </main>
  )
}
