import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { THEME, THEME_ATTRIBUTE } from "@/const"
import { resolveTheme, useTheme } from "../useTheme"

const mockUserSettings = vi.hoisted(() => ({ current: {} as any }))

vi.mock("@/hooks/useSettings", () => ({
  useUserSettings: () => ({ userSettings: mockUserSettings.current }),
}))

type ChangeListener = () => void

// Installs a controllable matchMedia for the color scheme query.
const mockColorScheme = (initialDark: boolean) => {
  const listeners = new Set<ChangeListener>()
  const mql = {
    matches: initialDark,
    addEventListener: vi.fn((_: string, cb: ChangeListener) =>
      listeners.add(cb),
    ),
    removeEventListener: vi.fn((_: string, cb: ChangeListener) =>
      listeners.delete(cb),
    ),
  }
  vi.mocked(window.matchMedia).mockImplementation(() => mql as any)
  return {
    setDark: (dark: boolean) => {
      mql.matches = dark
      listeners.forEach((cb) => cb())
    },
  }
}

describe("resolveTheme", () => {
  it("THM-01: 正常系: LIGHT/DARK はシステム設定に関係なくそのテーマになる", () => {
    expect(resolveTheme(THEME.LIGHT, true)).toBe("light")
    expect(resolveTheme(THEME.DARK, false)).toBe("dark")
  })

  it("THM-02: 正常系: SYSTEM はシステム設定に従う", () => {
    expect(resolveTheme(THEME.SYSTEM, true)).toBe("dark")
    expect(resolveTheme(THEME.SYSTEM, false)).toBe("light")
  })

  it("THM-03: 境界値: 設定が未保存の場合はシステム設定に従う", () => {
    expect(resolveTheme(undefined, true)).toBe("dark")
    expect(resolveTheme(undefined, false)).toBe("light")
  })
})

describe("useTheme", () => {
  let target: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()
    target = document.createElement("div")
    mockUserSettings.current = {}
  })

  it("THM-04: 正常系: 解決したテーマを対象要素の属性に設定する", () => {
    mockColorScheme(false)
    mockUserSettings.current = { theme: THEME.DARK }
    const { result } = renderHook(() => useTheme(target))
    expect(result.current).toBe("dark")
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("dark")
  })

  it("THM-05: 正常系: システム設定の変更に追従して属性を更新する", () => {
    const scheme = mockColorScheme(false)
    mockUserSettings.current = { theme: THEME.SYSTEM }
    renderHook(() => useTheme(target))
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("light")

    act(() => scheme.setDark(true))
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("dark")
  })

  it("THM-06: 正常系: 明示的なテーマ指定時はシステム設定の変更を無視する", () => {
    const scheme = mockColorScheme(false)
    mockUserSettings.current = { theme: THEME.LIGHT }
    renderHook(() => useTheme(target))

    act(() => scheme.setDark(true))
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("light")
  })

  it("THM-07: 境界値: 対象要素がなくてもテーマを返しエラーにならない", () => {
    mockColorScheme(true)
    const { result } = renderHook(() => useTheme(null))
    expect(result.current).toBe("dark")
  })
})
