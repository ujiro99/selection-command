import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { useImportExport } from "./useImportExport"
import {
  checkBackupStatus,
  readSettingsFile,
  INITIAL_BACKUP_STATUS,
} from "@/services/settings/importExport"

vi.mock("@/services/settings/importExport", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/settings/importExport")>()
  return {
    ...actual,
    checkBackupStatus: vi.fn(),
    readSettingsFile: vi.fn(),
  }
})

const mockCheckBackupStatus = vi.mocked(checkBackupStatus)
const mockReadSettingsFile = vi.mocked(readSettingsFile)

describe("useImportExport", () => {
  let alertSpy: ReturnType<typeof vi.spyOn>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckBackupStatus.mockResolvedValue(INITIAL_BACKUP_STATUS)
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    alertSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  const renderImportExport = async () => {
    const hook = renderHook(() => useImportExport())
    await waitFor(() => expect(mockCheckBackupStatus).toHaveBeenCalled())
    return hook
  }

  describe("selectImportFile", () => {
    it("UIE-01: should set importJson when the file is valid", async () => {
      const json = { folders: [] } as any
      mockReadSettingsFile.mockResolvedValue(json)
      const { result } = await renderImportExport()

      await act(() => result.current.selectImportFile(new File([""], "a.json")))

      expect(result.current.importJson).toBe(json)
      expect(alertSpy).not.toHaveBeenCalled()
    })

    it("UIE-02: should alert and not throw when the file is invalid", async () => {
      mockReadSettingsFile.mockRejectedValue(new SyntaxError("invalid json"))
      const { result } = await renderImportExport()

      await expect(
        act(() => result.current.selectImportFile(new File([""], "a.json"))),
      ).resolves.not.toThrow()

      expect(result.current.importJson).toBeUndefined()
      expect(alertSpy).toHaveBeenCalledWith("Failed to read settings file.")
    })

    it("UIE-03: should clear the previous file when an invalid file is selected", async () => {
      mockReadSettingsFile
        .mockResolvedValueOnce({ folders: [] } as any)
        .mockRejectedValueOnce(new SyntaxError("invalid json"))
      const { result } = await renderImportExport()

      await act(() => result.current.selectImportFile(new File([""], "a.json")))
      expect(result.current.importJson).toBeDefined()

      await act(() => result.current.selectImportFile(new File([""], "b.json")))
      expect(result.current.importJson).toBeUndefined()
    })
  })
})
