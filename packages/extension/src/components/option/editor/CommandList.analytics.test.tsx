import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { CommandList } from "./CommandList"
import { isHubShareable } from "@/services/hubShare"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { sendEvent } from "@/services/analytics"
import { OPEN_MODE } from "@/const"
import type { SelectionCommand, CommandFolder } from "@/types"

// Renders as plain buttons so the test can trigger onAddCommand/onAddFolder
// directly, bypassing the real menu UI.
vi.mock("./CommandListMenu", () => ({
  CommandListMenu: (props: any) => (
    <>
      <button onClick={props.onAddCommand}>add-command</button>
      <button onClick={props.onAddFolder}>add-folder</button>
    </>
  ),
}))

vi.mock("@/components/option/editor/CommandTypeSelectionDialog", () => ({
  CommandTypeSelectionDialog: (props: any) =>
    props.open ? (
      <>
        <button onClick={() => props.onSelect("search")}>
          select-type-search
        </button>
        <button onClick={() => props.onSelect("aiPrompt")}>
          select-type-aiprompt
        </button>
      </>
    ) : null,
}))

let nextSubmittedCommand: SelectionCommand | null = null

vi.mock("@/components/option/editor/CommandEditDialog", () => ({
  CommandEditDialog: (props: any) =>
    props.open ? (
      <button onClick={() => props.onSubmit(nextSubmittedCommand)}>
        submit-command
      </button>
    ) : null,
}))

let nextSubmittedFolder: CommandFolder | null = null

vi.mock("@/components/option/editor/FolderEditDialog", () => ({
  FolderEditDialog: (props: any) =>
    props.open ? (
      <button onClick={() => props.onSubmit(nextSubmittedFolder)}>
        submit-folder
      </button>
    ) : null,
}))

vi.mock("./CommandTreeRenderer", () => ({
  CommandTreeRenderer: () => null,
}))

vi.mock("@dnd-kit/core", () => ({
  DndContext: (props: any) => <>{props.children}</>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}))

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: (props: any) => <>{props.children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: {},
}))

vi.mock("@/hooks/option/useCommandActions", () => ({
  useCommandActions: () => ({ commandRemove: vi.fn() }),
}))

vi.mock("@/hooks/option/useCommandDragDrop", () => ({
  useCommandDragDrop: () => ({ handleDragEnd: vi.fn() }),
}))

vi.mock("@/hooks/option/useSharedCommandIds", () => ({
  useSharedCommandIds: () => new Set<string>(),
}))

vi.mock("@/services/hubShare", () => ({
  editCommandToHub: vi.fn(),
  isHubShareable: vi.fn(),
}))

vi.mock("@/components/option/HubShareToast", () => ({
  showHubShareToast: vi.fn(),
}))

vi.mock("@/services/settings/enhancedSettings", () => ({
  enhancedSettings: {
    getSection: vi.fn(),
  },
}))

vi.mock("@/services/settings/settings", () => ({
  Settings: {
    update: vi.fn(),
    updateCommandId: vi.fn(),
  },
}))

// Use the real getCommandCreateEvent mapping so this test also verifies
// CommandList wires the correct category-specific event, while keeping the
// network-calling sendEvent stubbed out.
vi.mock("@/services/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/analytics")>()
  return {
    ...actual,
    sendEvent: vi.fn(),
  }
})

const mockIsHubShareable = vi.mocked(isHubShareable)
const mockGetSection = vi.mocked(enhancedSettings.getSection)
const mockSendEvent = vi.mocked(sendEvent)

function Wrapper() {
  const { control } = useForm({
    defaultValues: { commands: [], folders: [] },
  })
  return <CommandList control={control} />
}

describe("CommandList: command_create_*/folder_create analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSection.mockResolvedValue({ hasShownHubShareToast: true } as any)
    mockIsHubShareable.mockReturnValue(false)
  })

  it("CA-01: sends command_create_search when a new search command is created", async () => {
    nextSubmittedCommand = {
      id: "new-cmd-1",
      title: "New Search Command",
      openMode: OPEN_MODE.POPUP,
      searchUrl: "https://example.com/search?q=%s",
    } as SelectionCommand

    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByText("add-command"))
    await user.click(screen.getByText("select-type-search"))
    await user.click(screen.getByText("submit-command"))

    expect(mockSendEvent).toHaveBeenCalledWith(
      "command_create_search",
      { event_label: OPEN_MODE.POPUP },
      "Option",
    )
  })

  it("CA-02: sends command_create_aiprompt when a new AI prompt command is created", async () => {
    nextSubmittedCommand = {
      id: "new-cmd-2",
      title: "New AI Command",
      openMode: OPEN_MODE.AI_PROMPT,
    } as SelectionCommand

    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByText("add-command"))
    await user.click(screen.getByText("select-type-aiprompt"))
    await user.click(screen.getByText("submit-command"))

    expect(mockSendEvent).toHaveBeenCalledWith(
      "command_create_aiprompt",
      { event_label: OPEN_MODE.AI_PROMPT },
      "Option",
    )
  })

  it("CA-03: sends folder_create when a new folder is created", async () => {
    nextSubmittedFolder = {
      id: "new-folder-1",
      title: "New Folder",
    }

    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByText("add-folder"))
    await user.click(screen.getByText("submit-folder"))

    expect(mockSendEvent).toHaveBeenCalledWith("folder_create", {}, "Option")
  })
})
