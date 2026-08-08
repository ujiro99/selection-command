import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { CommandList } from "./CommandList"
import { isHubShareable } from "@/services/hubShare"
import { showHubShareToast } from "@/components/option/HubShareToast"
import { enhancedSettings } from "@/services/settings/enhancedSettings"
import { Settings } from "@/services/settings/settings"
import { OPEN_MODE } from "@/const"
import type { SelectionCommand } from "@/types"

// Renders as a plain button so the test can trigger onAddCommand directly,
// bypassing the real menu UI.
vi.mock("./CommandListMenu", () => ({
  CommandListMenu: (props: any) => (
    <button onClick={props.onAddCommand}>add-command</button>
  ),
}))

vi.mock("@/components/option/editor/CommandTypeSelectionDialog", () => ({
  CommandTypeSelectionDialog: (props: any) =>
    props.open ? (
      <button onClick={() => props.onSelect("search")}>select-type</button>
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

vi.mock("@/components/option/editor/FolderEditDialog", () => ({
  FolderEditDialog: () => null,
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

vi.mock("@/services/analytics", () => ({
  ANALYTICS_EVENTS: {
    OPEN_DIALOG: "open_dialog",
    COMMAND_ADD: "command_add",
    COMMAND_EDIT: "command_edit",
    COMMAND_REMOVE: "command_remove",
  },
  sendEvent: vi.fn(),
}))

const mockIsHubShareable = vi.mocked(isHubShareable)
const mockShowHubShareToast = vi.mocked(showHubShareToast)
const mockGetSection = vi.mocked(enhancedSettings.getSection)
const mockSettingsUpdate = vi.mocked(Settings.update)

function Wrapper() {
  const { control } = useForm({
    defaultValues: { commands: [], folders: [] },
  })
  return <CommandList control={control} />
}

const newCommand: SelectionCommand = {
  id: "new-cmd-1",
  title: "New Command",
  openMode: OPEN_MODE.POPUP,
  searchUrl: "https://example.com/search?q=%s",
} as SelectionCommand

async function addNewCommand(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("add-command"))
  await user.click(screen.getByText("select-type"))
  await user.click(screen.getByText("submit-command"))
}

describe("CommandList: hub share toast trigger on new command creation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nextSubmittedCommand = newCommand
    mockGetSection.mockResolvedValue({ hasShownHubShareToast: false } as any)
    mockIsHubShareable.mockReturnValue(true)
  })

  it("CL-01: shows the hub share toast when the command is shareable and not yet shown", async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await addNewCommand(user)

    await waitFor(() => {
      expect(mockShowHubShareToast).toHaveBeenCalledWith(
        newCommand,
        expect.any(Function),
      )
    })
  })

  it("CL-02: does not show the toast when hasShownHubShareToast is already true", async () => {
    mockGetSection.mockResolvedValue({ hasShownHubShareToast: true } as any)
    const user = userEvent.setup()
    render(<Wrapper />)

    await addNewCommand(user)

    await waitFor(() => {
      expect(mockGetSection).toHaveBeenCalled()
    })
    expect(mockShowHubShareToast).not.toHaveBeenCalled()
  })

  it("CL-03: does not show the toast when the command is not hub-shareable", async () => {
    mockIsHubShareable.mockReturnValue(false)
    const user = userEvent.setup()
    render(<Wrapper />)

    await addNewCommand(user)

    await waitFor(() => {
      expect(mockGetSection).toHaveBeenCalled()
    })
    expect(mockShowHubShareToast).not.toHaveBeenCalled()
  })

  it("CL-04: the onShown callback persists the hasShownHubShareToast flag", async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await addNewCommand(user)

    await waitFor(() => {
      expect(mockShowHubShareToast).toHaveBeenCalled()
    })

    const onShown = mockShowHubShareToast.mock.calls[0][1]
    onShown()

    expect(mockSettingsUpdate).toHaveBeenCalledWith(
      "hasShownHubShareToast",
      expect.any(Function),
    )
  })
})
