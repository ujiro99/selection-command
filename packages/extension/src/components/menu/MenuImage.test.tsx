import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import css from "./Menu.module.css"
import { MenuImage } from "./MenuImage"
import { popupContext, ContextType } from "@/hooks/usePopupContext"
import { SIDE, ALIGN } from "@/const"

const renderWithContext = (
  ui: React.ReactElement,
  contextValue: Partial<ContextType> = {},
) => {
  const fullContext: ContextType = {
    side: SIDE.top,
    align: ALIGN.start,
    ...contextValue,
  }
  return render(
    <popupContext.Provider value={fullContext}>{ui}</popupContext.Provider>,
  )
}

describe("MenuImage - Global Icon Color Exclusion", () => {
  const testUiUrl =
    "https://cdn3.iconfinder.com/data/icons/feather-5/24/search-1024.png"
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
      <MenuImage
        src={testUiUrl}
        alt="test-icon"
        excludeFromGlobalIconColor={false}
        preserveOriginalColor={false}
      />,
      { hasIconColor: true },
    )
    const span = container.querySelector("span[role='img']")
    expect(span).not.toBeNull()
    expect(span?.classList.contains(css.itemImgMasked)).toBe(true)
    expect(span?.getAttribute("style")).toContain(testUiUrl)
    expect(container.querySelector("img")).toBeNull()
  })

  it("escapes quotes and backslashes in the icon URL so the CSS url() string stays intact", () => {
    const { container } = renderWithContext(
      <MenuImage
        src={'https://example.com/a".png?x=\\y'}
        alt="test-icon"
        excludeFromGlobalIconColor={false}
        preserveOriginalColor={false}
      />,
      { hasIconColor: true },
    )
    const span = container.querySelector("span[role='img']") as HTMLElement
    const style = span.getAttribute("style") ?? ""
    expect(style).toContain('a\\".png?x=\\\\y')
  })

  // Which icons keep their own colors is decided by the caller (the resolver
  // behind BgCommand.resolveIconColors), never by MenuImage itself, so without
  // that prop the icon is recolored like any other.
  it("recolors a website favicon the caller did not mark as preserved", () => {
    const { container } = renderWithContext(
      <MenuImage
        src={testFaviconUrl}
        alt="google-favicon"
        excludeFromGlobalIconColor={false}
      />,
      { hasIconColor: true },
    )
    const span = container.querySelector("span[role='img']")
    expect(span).not.toBeNull()
    expect(span?.getAttribute("style")).toContain(testFaviconUrl)
    expect(container.querySelector("img")).toBeNull()
  })

  it("renders a masked <span> for non-favicon UI icon when manual setting is absent", () => {
    const { container } = renderWithContext(
      <MenuImage
        src={testUiUrl}
        alt="test-icon"
        preserveOriginalColor={false}
      />,
      { hasIconColor: true },
    )
    const span = container.querySelector("span[role='img']")
    expect(span).not.toBeNull()
    expect(span?.classList.contains(css.itemImgMasked)).toBe(true)
    expect(container.querySelector("img")).toBeNull()
  })

  it("keeps original <img> when preserveOriginalColor is explicitly passed as true", () => {
    const { container } = renderWithContext(
      <MenuImage
        src={testUiUrl}
        alt="custom-brand"
        excludeFromGlobalIconColor={false}
        preserveOriginalColor={true}
      />,
      { hasIconColor: true },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(testUiUrl)
    expect(container.querySelector("span[role='img']")).toBeNull()
  })

  it("renders a standard <img> when global icon color is enabled but excludeFromGlobalIconColor is true", () => {
    const { container } = renderWithContext(
      <MenuImage
        src={testUiUrl}
        alt="test-icon"
        excludeFromGlobalIconColor={true}
        preserveOriginalColor={false}
      />,
      { hasIconColor: true },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(testUiUrl)
    expect(container.querySelector("span[role='img']")).toBeNull()
  })

  it("enables recoloring for a custom AI Prompt icon when manual exclusion is false", () => {
    const flaticonUrl =
      "https://cdn-icons-png.flaticon.com/512/11865/11865326.png"
    const { container } = renderWithContext(
      <MenuImage
        src={flaticonUrl}
        alt="AI Prompt Custom Icon"
        excludeFromGlobalIconColor={false}
        preserveOriginalColor={false}
      />,
      { hasIconColor: true },
    )
    const span = container.querySelector("span")
    expect(span).not.toBeNull()
    expect(span?.classList.contains(css.itemImgMasked)).toBe(true)
    expect(span?.getAttribute("style")).toContain(flaticonUrl)
    expect(container.querySelector("img")).toBeNull()
  })

  it("disables recoloring for a custom AI Prompt icon when excludeFromGlobalIconColor is true", () => {
    const flaticonUrl =
      "https://cdn-icons-png.flaticon.com/512/11865/11865326.png"
    const { container } = renderWithContext(
      <MenuImage
        src={flaticonUrl}
        alt="AI Prompt Custom Icon"
        excludeFromGlobalIconColor={true}
        preserveOriginalColor={false}
      />,
      { hasIconColor: true },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toBe(flaticonUrl)
    expect(container.querySelector("span")).toBeNull()
  })

  it("dynamically updates between recolorable custom icon and protected favicon on prop change", () => {
    const customUrl =
      "https://cdn-icons-png.flaticon.com/512/11865/11865326.png"
    const faviconUrl = "https://chatgpt.com/favicon.ico"

    // 1. Initial render with custom icon (preserveOriginalColor: false)
    const { container, rerender } = renderWithContext(
      <MenuImage
        src={customUrl}
        alt="Icon"
        excludeFromGlobalIconColor={false}
        preserveOriginalColor={false}
      />,
      { hasIconColor: true },
    )
    expect(container.querySelector("span")).not.toBeNull()
    expect(container.querySelector("img")).toBeNull()

    // 2. Dynamically change to favicon (preserveOriginalColor: true)
    rerender(
      <popupContext.Provider
        value={{ side: SIDE.top, align: ALIGN.start, hasIconColor: true }}
      >
        <MenuImage
          src={faviconUrl}
          alt="Icon"
          excludeFromGlobalIconColor={false}
          preserveOriginalColor={true}
        />
      </popupContext.Provider>,
    )
    expect(container.querySelector("img")).not.toBeNull()
    expect(container.querySelector("span")).toBeNull()

    // 3. Dynamically switch back to custom icon
    rerender(
      <popupContext.Provider
        value={{ side: SIDE.top, align: ALIGN.start, hasIconColor: true }}
      >
        <MenuImage
          src={customUrl}
          alt="Icon"
          excludeFromGlobalIconColor={false}
          preserveOriginalColor={false}
        />
      </popupContext.Provider>,
    )
    expect(container.querySelector("span")).not.toBeNull()
    expect(container.querySelector("img")).toBeNull()
  })

  it("applies var(--sc-icon-color) to inline SVG when global icon color is enabled and exclusion is false", () => {
    const { container } = renderWithContext(
      <MenuImage svg={testSvg} excludeFromGlobalIconColor={false} />,
      { hasIconColor: true },
    )
    const span = container.querySelector("span")
    expect(span).not.toBeNull()
    expect(span?.classList.contains(css.itemImgMasked)).toBe(true)
    expect(span?.getAttribute("style")).toContain("data:image/svg+xml")
  })

  it("keeps original foreground color on inline SVG when excludeFromGlobalIconColor is true", () => {
    const { container } = renderWithContext(
      <MenuImage svg={testSvg} excludeFromGlobalIconColor={true} />,
      { hasIconColor: true },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toContain("data:image/svg+xml")
  })

  it("keeps original foreground color on inline SVG when global icon color is disabled", () => {
    const { container } = renderWithContext(
      <MenuImage svg={testSvg} excludeFromGlobalIconColor={false} />,
      { hasIconColor: false },
    )
    const img = container.querySelector("img")
    expect(img).not.toBeNull()
    expect(img?.getAttribute("src")).toContain("data:image/svg+xml")
  })

  describe("Accessibility (alt / decorative handling)", () => {
    it("sets aria-hidden='true' and omits role='img' on masked span when alt is empty or not provided", () => {
      const { container } = renderWithContext(
        <MenuImage
          src={testUiUrl}
          alt=""
          excludeFromGlobalIconColor={false}
          preserveOriginalColor={false}
        />,
        { hasIconColor: true },
      )
      const span = container.querySelector("span")
      expect(span).not.toBeNull()
      expect(span?.getAttribute("aria-hidden")).toBe("true")
      expect(span?.getAttribute("role")).toBeNull()
      expect(span?.getAttribute("aria-label")).toBeNull()
    })

    it("sets role='img' and aria-label on masked span when meaningful alt is provided", () => {
      const { container } = renderWithContext(
        <MenuImage
          src={testUiUrl}
          alt="Search Icon"
          excludeFromGlobalIconColor={false}
          preserveOriginalColor={false}
        />,
        { hasIconColor: true },
      )
      const span = container.querySelector("span")
      expect(span).not.toBeNull()
      expect(span?.getAttribute("role")).toBe("img")
      expect(span?.getAttribute("aria-label")).toBe("Search Icon")
      expect(span?.getAttribute("aria-hidden")).toBeNull()
    })

    it("sets aria-hidden='true' on inline SVG image when alt is not provided", () => {
      const { container } = renderWithContext(<MenuImage svg={testSvg} />, {
        hasIconColor: false,
      })
      const img = container.querySelector("img")
      expect(img).not.toBeNull()
      expect(img?.getAttribute("aria-hidden")).toBe("true")
      expect(img?.getAttribute("role")).toBeNull()
    })

    it("sets the alt text on inline SVG image when meaningful alt is provided", () => {
      const { container } = renderWithContext(
        <MenuImage svg={testSvg} alt="Folder Icon" />,
        { hasIconColor: false },
      )
      const img = container.querySelector("img")
      expect(img).not.toBeNull()
      expect(img?.getAttribute("alt")).toBe("Folder Icon")
      expect(img?.getAttribute("aria-hidden")).toBeNull()
    })
  })
})
