import { describe, it, expect, vi, beforeEach } from "vitest"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE, PAGE_ACTION_EVENT } from "@/const"
import { PageAction } from "./pageAction"
import { Ipc, BgCommand } from "@/services/ipc"

vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  BgCommand: {
    openAndRunPageAction: "openAndRunPageAction",
  },
}))

vi.mock("@/services/screen", () => ({
  getWindowPosition: vi.fn().mockResolvedValue({ top: 100, left: 100 }),
}))

describe("PageAction.execute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseCommand = {
    id: "pa-cmd-1",
    title: "Test Page Action",
    iconUrl: "https://example.com/icon.png",
    openMode: OPEN_MODE.PAGE_ACTION,
    pageActionOption: {
      startUrl: "https://ai.example.com",
      openMode: PAGE_ACTION_OPEN_MODE.POPUP,
      steps: [
        {
          id: "step-1",
          param: {
            type: PAGE_ACTION_EVENT.input,
            label: "Input prompt",
            selector: "#input",
            value: "{{Prompt}}",
          },
        },
      ],
      prompt: "Summarize: {{SelectedText}}",
    },
  }

  it("PA-01: sends prompt in openAndRunPageAction payload", async () => {
    await PageAction.execute({
      command: baseCommand as any,
      selectionText: "Selected content",
      position: { x: 50, y: 50 },
    })

    expect(Ipc.send).toHaveBeenCalledWith(
      BgCommand.openAndRunPageAction,
      expect.objectContaining({
        commandId: "pa-cmd-1",
        selectedText: "Selected content",
        prompt: "Summarize: {{SelectedText}}",
        url: expect.objectContaining({
          searchUrl: "https://ai.example.com",
          selectionText: "Selected content",
          useClipboard: false,
        }),
      }),
    )
  })

  it("PA-02: detects indirect clipboard usage when step has {{Prompt}} and prompt has {{Clipboard}}", async () => {
    const commandWithClipboardPrompt = {
      ...baseCommand,
      pageActionOption: {
        ...baseCommand.pageActionOption,
        prompt: "Translate clipboard: {{Clipboard}}",
      },
    }

    await PageAction.execute({
      command: commandWithClipboardPrompt as any,
      selectionText: "",
      position: { x: 50, y: 50 },
    })

    expect(Ipc.send).toHaveBeenCalledWith(
      BgCommand.openAndRunPageAction,
      expect.objectContaining({
        url: expect.objectContaining({
          useClipboard: true,
        }),
      }),
    )
  })

  it("PA-03: does not request clipboard if prompt has {{Clipboard}} but no step uses {{Prompt}}", async () => {
    const commandWithoutPromptStep = {
      ...baseCommand,
      pageActionOption: {
        ...baseCommand.pageActionOption,
        steps: [
          {
            id: "step-1",
            param: {
              type: PAGE_ACTION_EVENT.input,
              label: "Input",
              selector: "#input",
              value: "{{SelectedText}}",
            },
          },
        ],
        prompt: "Translate clipboard: {{Clipboard}}",
      },
    }

    await PageAction.execute({
      command: commandWithoutPromptStep as any,
      selectionText: "hello",
      position: { x: 50, y: 50 },
    })

    expect(Ipc.send).toHaveBeenCalledWith(
      BgCommand.openAndRunPageAction,
      expect.objectContaining({
        url: expect.objectContaining({
          useClipboard: false,
        }),
      }),
    )
  })

  it("PA-04: works with legacy Page Action commands without prompt field", async () => {
    const legacyCommand = {
      id: "legacy-cmd",
      title: "Legacy Page Action",
      iconUrl: "https://example.com/icon.png",
      openMode: OPEN_MODE.PAGE_ACTION,
      pageActionOption: {
        startUrl: "https://example.com",
        openMode: PAGE_ACTION_OPEN_MODE.TAB,
        steps: [
          {
            id: "step-1",
            param: {
              type: PAGE_ACTION_EVENT.input,
              label: "Direct input",
              selector: "#input",
              value: "{{SelectedText}}",
            },
          },
        ],
      },
    }

    await PageAction.execute({
      command: legacyCommand as any,
      selectionText: "sample",
      position: { x: 10, y: 10 },
    })

    expect(Ipc.send).toHaveBeenCalledWith(
      BgCommand.openAndRunPageAction,
      expect.objectContaining({
        commandId: "legacy-cmd",
        prompt: undefined,
        url: expect.objectContaining({
          searchUrl: "https://example.com",
          selectionText: "sample",
          useClipboard: false,
        }),
      }),
    )
  })
})

