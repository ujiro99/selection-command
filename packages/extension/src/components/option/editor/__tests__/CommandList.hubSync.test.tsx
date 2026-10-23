import { useEffect } from "react"
import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { CommandList } from "../CommandList"
import { editCommandToHub, pushEditToHub } from "@/services/hubShare"
import { OPEN_MODE } from "@/const"
import type { SelectionCommand } from "@/types"

vi.mock("../CommandListMenu", () => ({
  CommandListMenu: () => null,
}))

vi.mock("@/components/option/editor/CommandTypeSelectionDialog", () => ({
  CommandTypeSelectionDialog: () => null,
}))

let nextSubmittedCommand: SelectionCommand | null = null

vi.mock("@/components/option/editor/CommandEditDialog", () => ({
  CommandEditDialog: (props: any) =>
    props.open ? (
      <>
        <button onClick={() => props.onSubmit(nextSubmittedCommand)}>
          submit-command
        </button>
        <button onClick={() => props.onSubmitAndShare(nextSubmittedCommand)}>
          submit-and-share-command
        </button>
      </>
    ) : null,
}))

vi.mock("@/components/option/editor/FolderEditDialog", () => ({
  FolderEditDialog: () => null,
}))

// Exposes the edit handler so the test can open the dialog for a command.
vi.mock("../CommandTreeRenderer", () => ({
  CommandTreeRenderer: (props: any) => (
    <button onClick={() => props.onEdit(0)}>edit-command</button>
  ),
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
  useSharedCommandIds: () => new Set<string>(["cmd-1"]),
}))

vi.mock("@/services/hubShare", () => ({
  editCommandToHub: vi.fn(() => true),
  pushEditToHub: vi.fn(() => true),
  isHubShareable: vi.fn(() => false),
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

vi.mock("@/services/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/analytics")>()
  return {
    ...actual,
    sendEvent: vi.fn(),
  }
})

const mockEditCommandToHub = vi.mocked(editCommandToHub)
const mockPushEditToHub = vi.mocked(pushEditToHub)

const storedCommand = {
  id: "cmd-1",
  title: "Before",
  openMode: OPEN_MODE.POPUP,
  searchUrl: "https://example.com/search?q=%s",
  contentHash: "old-hash",
} as SelectionCommand

const editedCommand = { ...storedCommand, title: "After" } as SelectionCommand

type SaveState = {
  // Whether the form has notified value changes (where SettingForm schedules
  // its debounced save).
  notified: boolean
  // Whether the debounced save was already scheduled when saveNow was called,
  // so that saveNow can take it over.
  notifiedBeforeSave?: boolean
  savedTitle?: string
}

/**
 * Mimics SettingForm: it subscribes to the form values (where the debounced
 * save is scheduled) and passes saveNow, which resolves when `resolveSave` is
 * called so the test can check what happens before the save completes.
 */
function Wrapper({
  state,
  onSaveStart,
}: {
  state: SaveState
  onSaveStart: (resolve: () => void) => void
}) {
  const { control, getValues, subscribe } = useForm({
    defaultValues: { commands: [storedCommand], folders: [] },
  })

  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => {
          state.notified = true
        },
      }),
    [subscribe, state],
  )

  const saveNow = () =>
    new Promise<void>((resolve) => {
      state.notifiedBeforeSave = state.notified
      state.savedTitle = getValues("commands")[0].title
      onSaveStart(resolve)
    })

  return <CommandList control={control} saveNow={saveNow} />
}

describe("CommandList: saving before sending a command to the Hub", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nextSubmittedCommand = editedCommand
  })

  afterEach(() => {
    history.replaceState(null, "", "/")
  })

  it("HS-01: 正常系: 「更新&共有」ではフォームの保存完了後に pushEditToHub を呼ぶ", async () => {
    const state: SaveState = { notified: false }
    let resolveSave: (() => void) | undefined
    const user = userEvent.setup()
    render(<Wrapper state={state} onSaveStart={(r) => (resolveSave = r)} />)

    await user.click(screen.getByText("edit-command"))
    await user.click(screen.getByText("submit-and-share-command"))

    // The edited command is saved, taking over the scheduled debounced save.
    expect(state.savedTitle).toBe("After")
    expect(state.notifiedBeforeSave).toBe(true)
    // Not pushed until the save completes.
    expect(mockPushEditToHub).not.toHaveBeenCalled()

    await act(async () => resolveSave?.())

    expect(mockPushEditToHub).toHaveBeenCalledWith(editedCommand)
    expect(mockEditCommandToHub).not.toHaveBeenCalled()
  })

  it("HS-02: 正常系: Hub からの編集ではフォームの保存完了後に editCommandToHub を呼ぶ", async () => {
    history.replaceState(null, "", "/?editCommand=cmd-1&syncHub=1")
    const state: SaveState = { notified: false }
    let resolveSave: (() => void) | undefined
    const user = userEvent.setup()
    render(<Wrapper state={state} onSaveStart={(r) => (resolveSave = r)} />)

    await user.click(screen.getByText("submit-command"))

    expect(state.savedTitle).toBe("After")
    expect(state.notifiedBeforeSave).toBe(true)
    expect(mockEditCommandToHub).not.toHaveBeenCalled()

    await act(async () => resolveSave?.())

    expect(mockEditCommandToHub).toHaveBeenCalledWith(editedCommand)
    expect(mockPushEditToHub).not.toHaveBeenCalled()
  })

  it("HS-03: 正常系: 通常の保存では Hub へ送信しない", async () => {
    const state: SaveState = { notified: false }
    const user = userEvent.setup()
    render(<Wrapper state={state} onSaveStart={() => {}} />)

    await user.click(screen.getByText("edit-command"))
    await user.click(screen.getByText("submit-command"))

    expect(state.savedTitle).toBeUndefined()
    expect(mockEditCommandToHub).not.toHaveBeenCalled()
    expect(mockPushEditToHub).not.toHaveBeenCalled()
  })
})
