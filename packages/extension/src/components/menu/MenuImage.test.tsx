import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { MenuImage } from "./MenuImage"
import { popupContext, ContextType } from "@/hooks/usePopupContext"
import { SIDE, ALIGN } from "@/const"

const renderWithContext = (ui: React.ReactElement, contextValue: Partial<ContextType> = {}) => {
  const fullContext: ContextType = {
    side: SIDE.top,
    align: ALIGN.start,
    ...contextValue,
  }
  return render(
    <popupContext.Provider value={fullContext}>
      {ui}
    </popupContext.Provider>,
  )
}

describe("MenuImage - Global Icon Color Override", () => {
  const testUiUrl = "https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png"
  const testFaviconUrl = "https://www.google.com/favicon.ico"
  const testSvg = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>'

  it("renders a standard <img> when global icon color is disabled (hasIconColor is falsy)", () => {
    const { container } = renderWithContext(
      <MenuImage src={testUiUrl} alt="test-icon" />,
      { hasIconColor: false },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(testUiUrl)
    expect(container.querySelector("span[role='img']")).toBeNull()
  })

  it("renders a masked <span> with background-color when global icon color is enabled and icon is a UI icon", () => {
    const { container } = renderWithContext(
      <MenuImage src={testUiUrl} alt="test-icon" overrideGlobalIconColor={false} isFavicon={false} />,
      { hasIconColor: true },
    )
    const span = container.querySelector("span[role='img']")
    expect(span).not.toBeNull()
    expect(span?.getAttribute("style")).toContain("var(--sc-icon-color)")
    expect(span?.getAttribute("style")).toContain(testUiUrl)
    expect(container.querySelector("img")).toBeNull()
  })

  it("keeps original <img> for website favicons even when global icon color is enabled", () => {
    const { container } = renderWithContext(
      <MenuImage src={testFaviconUrl} alt="google-favicon" overrideGlobalIconColor={false} />,
      { hasIconColor: true },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(testFaviconUrl)
    expect(container.querySelector("span[role='img']")).toBeNull()
  })

  it("keeps original <img> when isFavicon is explicitly passed as true", () => {
    const { container } = renderWithContext(
      <MenuImage src={testUiUrl} alt="custom-brand" overrideGlobalIconColor={false} isFavicon={true} />,
      { hasIconColor: true },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(testUiUrl)
    expect(container.querySelector("span[role='img']")).toBeNull()
  })

  it("renders a standard <img> when global icon color is enabled but overrideGlobalIconColor is true", () => {
    const { container } = renderWithContext(
      <MenuImage src={testUiUrl} alt="test-icon" overrideGlobalIconColor={true} isFavicon={false} />,
      { hasIconColor: true },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(testUiUrl)
    expect(container.querySelector("span[role='img']")).toBeNull()
  })

  it("applies var(--sc-icon-color) to inline SVG when global icon color is enabled and override is false", () => {
    const { container } = renderWithContext(
      <MenuImage svg={testSvg} overrideGlobalIconColor={false} />,
      { hasIconColor: true },
    )
    const div = container.querySelector("div")
    expect(div).not.toBeNull()
    expect(div?.getAttribute("style")).toContain("var(--sc-icon-color)")
  })

  it("keeps original foreground color on inline SVG when overrideGlobalIconColor is true", () => {
    const { container } = renderWithContext(
      <MenuImage svg={testSvg} overrideGlobalIconColor={true} />,
      { hasIconColor: true },
    )
    const div = container.querySelector("div")
    expect(div).not.toBeNull()
    expect(div?.getAttribute("style")).toContain("hsl(var(--foreground))")
  })

  it("keeps original foreground color on inline SVG when global icon color is disabled", () => {
    const { container } = renderWithContext(
      <MenuImage svg={testSvg} overrideGlobalIconColor={false} />,
      { hasIconColor: false },
    )
    const div = container.querySelector("div")
    expect(div).not.toBeNull()
    expect(div?.getAttribute("style")).toContain("hsl(var(--foreground))")
  })
})
