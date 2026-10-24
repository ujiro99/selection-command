import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { OptionMenuImage } from "../OptionMenuImage"
import { themeContext, type ResolvedTheme } from "@/hooks/useTheme"

const UI_ICON_URL =
  "https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png"
const FAVICON_URL = "https://www.google.com/favicon.ico"

const renderWithTheme = (ui: React.ReactElement, theme: ResolvedTheme) =>
  render(<themeContext.Provider value={theme}>{ui}</themeContext.Provider>)

const isMasked = (container: HTMLElement) =>
  container.querySelector("span[role='img']") != null

describe("OptionMenuImage", () => {
  it("OMI-01: 正常系: ライトテーマではアイコンを塗り替えない", () => {
    const { container } = renderWithTheme(
      <OptionMenuImage src={UI_ICON_URL} alt="icon" />,
      "light",
    )
    expect(isMasked(container)).toBe(false)
    expect(container.querySelector("img")).not.toBeNull()
  })

  it("OMI-02: 正常系: ダークテーマでは汎用アイコンを塗り替える", () => {
    const { container } = renderWithTheme(
      <OptionMenuImage src={UI_ICON_URL} alt="icon" />,
      "dark",
    )
    expect(isMasked(container)).toBe(true)
  })

  it("OMI-03: 正常系: ダークテーマでも favicon は元の色のまま表示する", () => {
    const { container } = renderWithTheme(
      <OptionMenuImage src={FAVICON_URL} alt="icon" />,
      "dark",
    )
    expect(isMasked(container)).toBe(false)
  })

  it("OMI-04: 正常系: ダークテーマでも塗り替え除外のアイコンは元の色のまま表示する", () => {
    const { container } = renderWithTheme(
      <OptionMenuImage
        src={UI_ICON_URL}
        alt="icon"
        excludeFromGlobalIconColor={true}
      />,
      "dark",
    )
    expect(isMasked(container)).toBe(false)
  })
})
