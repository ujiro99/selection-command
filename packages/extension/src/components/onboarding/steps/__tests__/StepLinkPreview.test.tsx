import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { __test } from "../StepLinkPreview"
import { KEYBOARD, LINK_COMMAND_STARTUP_METHOD } from "@/const"
import DefaultSettings from "@/services/option/defaultSettings"

const { GestureHint } = __test

vi.mock("@/lib/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils")>()),
  isMac: () => false,
}))

describe("GestureHint", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("LP-01: 正常系: 長押しでは長押しの案内を表示する", () => {
    render(
      <GestureHint
        method={LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD}
        keyboardParam={KEYBOARD.SHIFT}
      />,
    )

    expect(screen.getByText("onboarding_step3Callout_hold")).toBeInTheDocument()
    expect(screen.queryByText("onboarding_clickKeycap")).toBeNull()
  })

  it("LP-02: 正常系: クリック + キーでは設定したキーとクリックの案内を表示する", () => {
    render(
      <GestureHint
        method={LINK_COMMAND_STARTUP_METHOD.KEYBOARD}
        keyboardParam={KEYBOARD.ALT}
      />,
    )

    expect(chrome.i18n.getMessage).toHaveBeenCalledWith(
      "onboarding_step3Callout",
      ["Option_keyboardParam_Alt_windows"],
    )
    expect(
      screen.getByText("Option_keyboardParam_Alt_windows"),
    ).toBeInTheDocument()
    expect(screen.getByText("onboarding_clickKeycap")).toBeInTheDocument()
  })

  it("LP-03: 正常系: ドラッグではドラッグの案内を表示する", () => {
    render(
      <GestureHint
        method={LINK_COMMAND_STARTUP_METHOD.DRAG}
        keyboardParam={KEYBOARD.SHIFT}
      />,
    )

    expect(screen.getByText("onboarding_step3Callout_drag")).toBeInTheDocument()
    expect(screen.queryByText("onboarding_clickKeycap")).toBeNull()
  })

  it("LP-02-a: 正常系: キー未設定では Shift のラベルとアイコンを表示する", () => {
    const { container } = render(
      <GestureHint
        method={LINK_COMMAND_STARTUP_METHOD.KEYBOARD}
        keyboardParam={undefined}
      />,
    )

    expect(
      screen.getByText("Option_keyboardParam_Shift_windows"),
    ).toBeInTheDocument()
    expect(container.querySelector(".lucide-arrow-big-up")).not.toBeNull()
  })

  it("LP-02-b: 正常系: Shift 以外のキーでは Shift のアイコンを表示しない", () => {
    const { container } = render(
      <GestureHint
        method={LINK_COMMAND_STARTUP_METHOD.KEYBOARD}
        keyboardParam={KEYBOARD.ALT}
      />,
    )

    expect(container.querySelector(".lucide-arrow-big-up")).toBeNull()
  })

  it("LP-04: 正常系: 新規インストールのデフォルトは長押しで起動する", () => {
    expect(DefaultSettings.linkCommand.startupMethod.method).toBe(
      LINK_COMMAND_STARTUP_METHOD.LEFT_CLICK_HOLD,
    )
  })
})
