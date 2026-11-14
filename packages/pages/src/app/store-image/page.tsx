import type { Metadata } from "next"
import {
  Bot,
  EllipsisVertical,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Languages,
  MessageCircle,
  MonitorPlay,
  MousePointerClick,
  Search,
  ShoppingBag,
  Sparkle,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Logo } from "@/components/Logo"

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

// Use cases listed under the lead copy, based on popular commands on
// selection-command.com.
const CHIPS: { label: string; icon: LucideIcon }[] = [
  { label: "検索", icon: Search },
  { label: "AIに聞く", icon: Sparkle },
  { label: "翻訳", icon: Languages },
  { label: "要約", icon: FileText },
  { label: "画像検索", icon: ImageIcon },
  { label: "動画検索", icon: MonitorPlay },
  { label: "買い物", icon: ShoppingBag },
  { label: "SNS検索", icon: MessageCircle },
  { label: "リンクプレビュー", icon: Eye },
  { label: "自動操作", icon: MousePointerClick },
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
          {/* Plain img: next/image would point at /_next/image, which
              does not exist in the static export. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/store-image/icon128.png"
            alt=""
            width={44}
            height={44}
            className={css.brandIcon}
          />
          <Logo variant="lg" hub={false} />
        </div>

        <p className={css.eyebrow}>SELECTION → COMMAND</p>

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
          {CHIPS.map(({ label, icon: Icon }) => (
            <li key={label} className={css.chip}>
              <Icon size={17} strokeWidth={2.4} className={css.chipIcon} />
              {label}
            </li>
          ))}
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
          {/* Same icon as the hovered menu item, tying the tooltip to it */}
          <span className={css.tooltipIcon}>
            <Search size={22} strokeWidth={2.6} />
          </span>
          <p className={css.tooltipTitle}>
            選択した言葉を
            <br />
            ワンクリックで検索
          </p>
        </div>
      </div>
    </main>
  )
}
