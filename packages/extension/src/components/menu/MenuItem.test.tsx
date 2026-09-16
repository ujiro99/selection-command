import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import css from "./Menu.module.css"
import { MenuItem } from "./MenuItem"
import { popupContext, ContextType } from "@/hooks/usePopupContext"
import { IconUrlsContext } from "./iconUrls"
import { SIDE, ALIGN, OPEN_MODE, ExecState } from "@/const"
import { ONBOARDING_AI_PROMPT_COMMAND_ID } from "@/components/onboarding/onboardingCommand"
import type { AiPromptCommand } from "@/types"

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

const renderMenuItem = (
  command: AiPromptCommand,
  iconUrls: Record<string, string> = {},
  hasIconColor = true,
) => {
  const fullContext: ContextType = {
    side: SIDE.top,
    align: ALIGN.start,
    hasIconColor,
  }
  const menuRef = { current: document.createElement("div") }

  return render(
    <popupContext.Provider value={fullContext}>
      <IconUrlsContext.Provider value={{ commands: iconUrls, folders: {} }}>
        <MenuItem menuRef={menuRef} onlyIcon={true} command={command} />
      </IconUrlsContext.Provider>
    </popupContext.Provider>,
  )
}

describe("MenuItem - AI Prompt Command Icon Recoloring", () => {
  const flaticonUrl =
    "https://cdn-icons-png.flaticon.com/512/11865/11865326.png"
  const cachedDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

  it("renders a masked <span> for AI Prompt command with custom Flaticon URL when recoloring is enabled", () => {
    const aiCommand: AiPromptCommand = {
      id: ONBOARDING_AI_PROMPT_COMMAND_ID,
      title: "Run with AI",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: cachedDataUrl,
      excludeFromGlobalIconColor: false,
      aiPromptOption: {
        serviceId: "chatgpt",
        prompt: "test",
        openMode: OPEN_MODE.SIDE_PANEL,
      },
    } as any

    const iconUrls = {
      [ONBOARDING_AI_PROMPT_COMMAND_ID]: flaticonUrl,
    }

    const { container } = renderMenuItem(aiCommand, iconUrls, true)

    // Button should match DevTools output
    const button = container.querySelector(
      "button[data-command-id='8b6f2e10-9a44-5c7d-8b3f-2e6a7c1d4f90']",
    )
    expect(button).not.toBeNull()

    const span = button?.querySelector(
      "span._itemImgMasked_fcefc6, span[class*='itemImgMasked']",
    )
    expect(span).not.toBeNull()
    expect(button?.querySelector("img")).toBeNull()
    expect(span?.classList.contains(css.itemImgMasked)).toBe(true)
    expect(span?.getAttribute("style")).toContain(cachedDataUrl)
  })

  it("renders an <img> for AI Prompt command with custom Flaticon URL when excludeFromGlobalIconColor is true", () => {
    const aiCommand: AiPromptCommand = {
      id: ONBOARDING_AI_PROMPT_COMMAND_ID,
      title: "Run with AI",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: cachedDataUrl,
      excludeFromGlobalIconColor: true,
      aiPromptOption: {
        serviceId: "chatgpt",
        prompt: "test",
        openMode: OPEN_MODE.SIDE_PANEL,
      },
    } as any

    const iconUrls = {
      [ONBOARDING_AI_PROMPT_COMMAND_ID]: flaticonUrl,
    }

    const { container } = renderMenuItem(aiCommand, iconUrls, true)

    const button = container.querySelector(
      "button[data-command-id='8b6f2e10-9a44-5c7d-8b3f-2e6a7c1d4f90']",
    )
    expect(button).not.toBeNull()

    // Must render <img>, NOT masked span
    const img = button?.querySelector("img")
    expect(img).not.toBeNull()
    expect(button?.querySelector("span[class*='itemImgMasked']")).toBeNull()
    expect(img?.getAttribute("src")).toBe(cachedDataUrl)
  })

  it("renders an <img> for AI Prompt command when genuine ChatGPT favicon is used (automatic protection)", () => {
    const chatGptFavicon = "https://chatgpt.com/favicon.ico"
    const aiCommand: AiPromptCommand = {
      id: ONBOARDING_AI_PROMPT_COMMAND_ID,
      title: "Run with AI",
      openMode: OPEN_MODE.AI_PROMPT,
      iconUrl: cachedDataUrl,
      excludeFromGlobalIconColor: false,
      aiPromptOption: {
        serviceId: "chatgpt",
        prompt: "test",
        openMode: OPEN_MODE.SIDE_PANEL,
      },
    } as any

    const iconUrls = {
      [ONBOARDING_AI_PROMPT_COMMAND_ID]: chatGptFavicon,
    }

    const { container } = renderMenuItem(aiCommand, iconUrls, true)

    const button = container.querySelector(
      "button[data-command-id='8b6f2e10-9a44-5c7d-8b3f-2e6a7c1d4f90']",
    )
    expect(button).not.toBeNull()

    // Must render <img> because genuine favicon is protected
    const img = button?.querySelector("img")
    expect(img).not.toBeNull()
    expect(button?.querySelector("span[class*='itemImgMasked']")).toBeNull()
  })
})
