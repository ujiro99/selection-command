import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { themeContext, type ResolvedTheme } from "@/hooks/useTheme"
import { useLogoUrl } from "../onboardingLogo"

// The logo URLs are resolved when the module loads, before any test runs.
vi.hoisted(() => {
  vi.mocked(chrome.runtime.getURL).mockImplementation(
    (path: string) => `chrome-extension://test/${path}`,
  )
})

const renderWithTheme = (theme: ResolvedTheme) =>
  renderHook(() => useLogoUrl(), {
    wrapper: ({ children }) => (
      <themeContext.Provider value={theme}>{children}</themeContext.Provider>
    ),
  })

describe("useLogoUrl", () => {
  it("OL-01: 正常系: ライトテーマでは通常のロゴを返す", () => {
    const { result } = renderWithTheme("light")
    expect(result.current).toContain("SelectionCommandLogo.png")
  })

  it("OL-02: 正常系: ダークテーマではダーク用のロゴを返す", () => {
    const { result } = renderWithTheme("dark")
    expect(result.current).toContain("SelectionCommandLogo_dark.png")
  })
})
