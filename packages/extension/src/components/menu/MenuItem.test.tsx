import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import css from "./Menu.module.css"
import { MenuItem } from "./MenuItem"
import { popupContext, ContextType } from "@/hooks/usePopupContext"
import { SIDE, ALIGN, OPEN_MODE, ExecState } from "@/const"
import { ONBOARDING_AI_PROMPT_COMMAND_ID } from "@/components/onboarding/onboardingCommand"
import type { ResolvedCommand } from "@/hooks/useSettingsWithImageCache"

vi.mock("@/hooks/useCommandExecutor", () => ({
  useCommandExecutor: () => ({
    itemState: { state: ExecState.NONE, message: "" },
    result: null,
    executeCommand: vi.fn(),
    clearResult: vi.fn(),
  }),
}))

vi.mock("@/hooks/useSelectContext", () => ({
  useSelectContext: () => ({
    selectionText: "test",
    target: null,
  }),
}))

vi.mock("@/lib/commandEnabled", () => ({
  getCommandEnabled: () => ({ enabled: true, message: "" }),
}))

const renderMenuItem = (command: ResolvedCommand, hasIconColor = true) => {
  const fullContext: ContextType = {
    side: SIDE.top,
    align: ALIGN.start,
    hasIconColor,
  }
  const menuRef = { current: document.createElement("div") }

  return render(
    <popupContext.Provider value={fullContext}>
      <MenuItem menuRef={menuRef} onlyIcon={true} command={command} />
    </popupContext.Provider>,
  )
}

describe("MenuItem - AI Prompt Command Icon Recoloring", () => {
  // The rendered URL is the cached data URL; whether it may be recolored is
  // resolved from the configured URL by useSettingsWithImageCache.
  const cachedDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

  const createAiCommand = (
    overrides: Partial<ResolvedCommand> = {},
  ): ResolvedCommand =>
    ({
      id: ONBOARDING_AI_PROMPT_COMMAND_ID,
      title: "Run with AI",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: cachedDataUrl,
      excludeFromGlobalIconColor: false,
      preserveOriginalColor: false,
      aiPromptOption: {
        serviceId: "chatgpt",
        prompt: "test",
        openMode: OPEN_MODE.SIDE_PANEL,
      },
      ...overrides,
    }) as any

  const queryButton = (container: HTMLElement) =>
    container.querySelector(
      "button[data-command-id='8b6f2e10-9a44-5c7d-8b3f-2e6a7c1d4f90']",
    )

  it("renders a masked <span> for an AI Prompt command whose icon may be recolored", () => {
    const { container } = renderMenuItem(createAiCommand(), true)

    // Button should match DevTools output
    const button = queryButton(container)
    expect(button).not.toBeNull()

    const span = button?.querySelector(
      "span._itemImgMasked_fcefc6, span[class*='itemImgMasked']",
    )
    expect(span).not.toBeNull()
    expect(button?.querySelector("img")).toBeNull()
    expect(span?.classList.contains(css.itemImgMasked)).toBe(true)
    expect(span?.getAttribute("style")).toContain(cachedDataUrl)
  })

  it("renders an <img> for an AI Prompt command when excludeFromGlobalIconColor is true", () => {
    const { container } = renderMenuItem(
      createAiCommand({ excludeFromGlobalIconColor: true }),
      true,
    )

    const button = queryButton(container)
    expect(button).not.toBeNull()

    // Must render <img>, NOT masked span
    const img = button?.querySelector("img")
    expect(img).not.toBeNull()
    expect(button?.querySelector("span[class*='itemImgMasked']")).toBeNull()
    expect(img?.getAttribute("src")).toBe(cachedDataUrl)
  })

  it("renders an <img> for an AI Prompt command whose icon keeps its own colors", () => {
    const { container } = renderMenuItem(
      createAiCommand({ preserveOriginalColor: true }),
      true,
    )

    const button = queryButton(container)
    expect(button).not.toBeNull()

    // Must render <img> because the icon is protected from recoloring
    const img = button?.querySelector("img")
    expect(img).not.toBeNull()
    expect(button?.querySelector("span[class*='itemImgMasked']")).toBeNull()
  })
})
