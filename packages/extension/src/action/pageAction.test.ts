import { describe, it, expect, vi, beforeEach } from "vitest"
import { OPEN_MODE, PAGE_ACTION_OPEN_MODE, PAGE_ACTION_EVENT } from "@/const"
import { PageAction } from "./pageAction"
import { Ipc, BgCommand } from "@/services/ipc"
import { Storage, SESSION_STORAGE_KEY } from "@/services/storage"

vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn(),
  },
  BgCommand: {
    openAndRunPageAction: "openAndRunPageAction",
    openSidePanel: "openSidePanel",
  },
}))

vi.mock("@/services/storage", () => ({
  Storage: {
    set: vi.fn().mockResolvedValue(undefined),
  },
  SESSION_STORAGE_KEY: {
    PA_SIDE_PANEL_PENDING: "PA_SIDE_PANEL_PENDING",
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

  it("PA-05: executes in side panel mode, stores pending action in session storage, and sends openSidePanel IPC", async () => {
    const sidePanelCommand = {
      ...baseCommand,
      pageActionOption: {
        ...baseCommand.pageActionOption,
        openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
      },
    }

    await PageAction.execute({
      command: sidePanelCommand as any,
      selectionText: "side panel content",
      position: { x: 50, y: 50 },
      pageUrl: "https://origin.example.com",
    })

    expect(Storage.set).toHaveBeenCalledWith(
      SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
      expect.objectContaining({
        url: "https://ai.example.com",
        steps: sidePanelCommand.pageActionOption.steps,
        selectedText: "side panel content",
        srcUrl: "https://origin.example.com",
        clipboardText: "",
        useClipboard: false,
        prompt: "Summarize: {{SelectedText}}",
      }),
    )

    expect(Ipc.send).toHaveBeenCalledWith(BgCommand.openSidePanel, {
      url: "https://ai.example.com",
    })
    expect(Ipc.send).not.toHaveBeenCalledWith(
      BgCommand.openAndRunPageAction,
      expect.anything(),
    )
  })

  it("PA-06: executes in side panel mode even when position is null", async () => {
    const sidePanelCommand = {
      ...baseCommand,
      pageActionOption: {
        ...baseCommand.pageActionOption,
        openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
      },
    }

    await PageAction.execute({
      command: sidePanelCommand as any,
      selectionText: "context menu invocation",
      position: null,
    })

    expect(Storage.set).toHaveBeenCalledWith(
      SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
      expect.objectContaining({
        selectedText: "context menu invocation",
      }),
    )
    expect(Ipc.send).toHaveBeenCalledWith(BgCommand.openSidePanel, {
      url: "https://ai.example.com",
    })
  })

  it("PA-07: executes in side panel mode and detects indirect clipboard usage", async () => {
    const sidePanelCommand = {
      ...baseCommand,
      pageActionOption: {
        ...baseCommand.pageActionOption,
        openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
        prompt: "Translate clipboard: {{Clipboard}}",
      },
    }

    await PageAction.execute({
      command: sidePanelCommand as any,
      selectionText: "",
      position: { x: 50, y: 50 },
    })

    expect(Storage.set).toHaveBeenCalledWith(
      SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
      expect.objectContaining({
        useClipboard: true,
        prompt: "Translate clipboard: {{Clipboard}}",
      }),
    )
  })

  it("PA-08: executes in side panel mode without prompt (backward compatibility)", async () => {
    const sidePanelLegacyCommand = {
      ...baseCommand,
      pageActionOption: {
        startUrl: "https://ai.example.com",
        openMode: PAGE_ACTION_OPEN_MODE.SIDE_PANEL,
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
      },
    }

    await PageAction.execute({
      command: sidePanelLegacyCommand as any,
      selectionText: "legacy text",
      position: null,
    })

    expect(Storage.set).toHaveBeenCalledWith(
      SESSION_STORAGE_KEY.PA_SIDE_PANEL_PENDING,
      expect.objectContaining({
        url: "https://ai.example.com",
        selectedText: "legacy text",
        prompt: undefined,
      }),
    )
    expect(Ipc.send).toHaveBeenCalledWith(BgCommand.openSidePanel, {
      url: "https://ai.example.com",
    })
  })
})

