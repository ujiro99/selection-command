import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { THEME, THEME_ATTRIBUTE } from "@/const"
import {
  applyInitialTheme,
  resolveTheme,
  useTheme,
  THEME_CACHE_KEY,
} from "../useTheme"

const mockUserSettings = vi.hoisted(() => ({ current: {} as any }))
const mockLoading = vi.hoisted(() => ({ current: false }))

vi.mock("@/hooks/useSettings", () => ({
  useUserSettings: () => ({
    userSettings: mockUserSettings.current,
    loading: mockLoading.current,
  }),
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
    mockLoading.current = false
    localStorage.clear()
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  })

  afterEach(() => {
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
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

  it("THM-08: 正常系: アンマウント後も対象要素の属性を残す", () => {
    mockColorScheme(false)
    mockUserSettings.current = { theme: THEME.DARK }
    const { unmount } = renderHook(() => useTheme(target))
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("dark")

    // Removing it would leave StrictMode's remount without the theme.
    unmount()
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("dark")
  })

  it("THM-09: 正常系: 設定の読み込み中は適用済みのテーマを維持する", () => {
    mockColorScheme(false)
    target.setAttribute(THEME_ATTRIBUTE, "dark")
    mockLoading.current = true
    const { result, rerender } = renderHook(() => useTheme(target))
    expect(result.current).toBe("dark")
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("dark")

    // Once loaded, the setting takes over.
    mockLoading.current = false
    mockUserSettings.current = { theme: THEME.LIGHT }
    rerender()
    expect(result.current).toBe("light")
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("light")
  })

  it("THM-10: 正常系: 読み込み中でも属性が未設定ならシステム設定を適用する", () => {
    mockColorScheme(true)
    mockLoading.current = true
    const { result } = renderHook(() => useTheme(target))
    expect(result.current).toBe("dark")
    expect(target.getAttribute(THEME_ATTRIBUTE)).toBe("dark")
  })

  it("THM-11: 正常系: ドキュメントルートのテーマを読み込み後にキャッシュする", () => {
    mockColorScheme(false)
    mockUserSettings.current = { theme: THEME.DARK }
    mockLoading.current = true
    const { rerender } = renderHook(() =>
      useTheme(document.documentElement),
    )
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBeNull()

    mockLoading.current = false
    rerender()
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBe("dark")
  })

  it("THM-12: 正常系: ドキュメントルート以外のテーマはキャッシュしない", () => {
    mockColorScheme(false)
    mockUserSettings.current = { theme: THEME.DARK }
    renderHook(() => useTheme(target))
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBeNull()
  })

  it("THM-13: 正常系: テーマ切替の間だけトランジションを無効化する", () => {
    // Drop the styles left by the previous tests, whose timers ran for real.
    document.head.querySelectorAll("style").forEach((s) => s.remove())
    vi.useFakeTimers()
    try {
      const scheme = mockColorScheme(false)
      mockUserSettings.current = { theme: THEME.SYSTEM }
      renderHook(() => useTheme(target))
      vi.runAllTimers()

      act(() => scheme.setDark(true))
      const findStyle = () =>
        Array.from(document.head.querySelectorAll("style")).find((s) =>
          s.textContent?.includes("transition:none"),
        )
      expect(findStyle()).toBeDefined()

      vi.runAllTimers()
      expect(findStyle()).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("applyInitialTheme", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  })

  afterEach(() => {
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  })

  it("THM-14: 正常系: キャッシュしたテーマを適用する", () => {
    mockColorScheme(false)
    localStorage.setItem(THEME_CACHE_KEY, "dark")
    applyInitialTheme()
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark")
  })

  it("THM-15: 正常系: キャッシュがなければシステム設定を適用する", () => {
    mockColorScheme(true)
    applyInitialTheme()
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark")
  })

  it("THM-16: 異常系: 不正なキャッシュ値は無視してシステム設定を適用する", () => {
    mockColorScheme(false)
    localStorage.setItem(THEME_CACHE_KEY, "invalid")
    applyInitialTheme()
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(
      "light",
    )
  })
})
