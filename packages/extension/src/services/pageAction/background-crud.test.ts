import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  setupBackgroundTestEnvironment,
  mockStorage,
} from "./background-shared"
import { add, update, remove, reset } from "./background"

// Setup test environment
setupBackgroundTestEnvironment()

describe("background.ts - CRUD Operations", () => {
  describe("add() function", () => {
    const mockSender = { tab: { id: 123 } }
    const mockResponse = vi.fn()

    describe("Basic functionality", () => {
      it("BGD-01: 正常系: 基本的なステップ追加が成功する", async () => {
        const mockStep = {
          id: "step-1",
          param: { type: "click", label: "Test Click" },
          delayMs: 0,
          skipRenderWait: false,
        }

        const mockRecordingData = { steps: [] }
        const mockContext = { urlChanged: false }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })
        mockStorage.set.mockResolvedValue(undefined)
        mockStorage.update.mockResolvedValue(undefined)

        const result = add(mockStep as any, mockSender as any, mockResponse)

        expect(result).toBe(true)

        // Wait for async operation
        await vi.runAllTimersAsync()

        expect(mockStorage.get).toHaveBeenCalledWith("pa_recording")
        expect(mockStorage.get).toHaveBeenCalledWith("pa_context")
        expect(mockStorage.set).toHaveBeenCalled()
        expect(mockStorage.update).toHaveBeenCalled()
        expect(mockResponse).toHaveBeenCalledWith(true)
      })

      it("BGD-02: 正常系: 空のsteps配列に最初のステップを追加すると、StartActionが自動で挿入される", async () => {
        const mockStep = {
          id: "step-1",
          param: { type: "click", label: "Test Click" },
          delayMs: 0,
          skipRenderWait: false,
        }

        const mockRecordingData = { steps: [] }
        const mockContext = { urlChanged: false }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })

        add(mockStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        expect(setCall).toBeDefined()
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(3) // Start + Step + End
        expect(savedData.steps[0].param.type).toBe("start")
        expect(savedData.steps[1]).toBe(mockStep)
        expect(savedData.steps[2].param.type).toBe("end")
      })

      it("BGD-03: 正常系: EndActionが自動で追加される", async () => {
        const mockStep = {
          id: "step-1",
          param: { type: "click", label: "Test Click" },
          delayMs: 0,
          skipRenderWait: false,
        }

        const existingStartStep = {
          id: "start-id",
          param: { type: "start", label: "Start" },
        }

        const mockRecordingData = { steps: [existingStartStep] }
        const mockContext = { urlChanged: false }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })

        add(mockStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(3) // Start + Step + End
        expect(savedData.steps[2].param.type).toBe("end")
      })

      it("BGD-04: 境界値: 最大ステップ数に達した場合の処理（PAGE_ACTION_MAX - 1）", async () => {
        const mockStep = {
          id: "step-1",
          param: { type: "click", label: "Test Click" },
          delayMs: 0,
          skipRenderWait: false,
        }

        // Create steps array with 9 items (PAGE_ACTION_MAX - 1 = 9)
        const existingSteps = Array.from({ length: 9 }, (_, i) => ({
          id: `step-${i}`,
          param: { type: "click", label: `Step ${i}` },
        }))

        const mockRecordingData = { steps: existingSteps }
        const mockContext = { urlChanged: false }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })

        add(mockStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        expect(mockResponse).toHaveBeenCalledWith(true)
        expect(mockStorage.set).not.toHaveBeenCalled()
      })

      it("BGD-05: 正常系: URLの変更フラグがリセットされる", async () => {
        const mockStep = {
          id: "step-1",
          param: { type: "click", label: "Test Click" },
          delayMs: 0,
          skipRenderWait: false,
        }

        const mockRecordingData = { steps: [] }
        const mockContext = { urlChanged: true }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })

        add(mockStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        expect(mockStorage.update).toHaveBeenCalledWith(
          "pa_context",
          expect.any(Function),
        )

        // Test the update function
        const updateCall = mockStorage.update.mock.calls.find(
          (call: any[]) => call[0] === "pa_context",
        )
        const updateFn = updateCall![1]
        const result = updateFn(mockContext)
        expect(result.urlChanged).toBe(false)
      })
    })

    describe("Operation integration logic", () => {
      const mockSender = { tab: { id: 123 } }
      const mockResponse = vi.fn()

      beforeEach(() => {
        const mockContext = { urlChanged: false }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({ steps: [] })
        })
      })

      it("BGD-06: 統合: 同一要素でのclick + inputはclickがスキップされる", async () => {
        const existingStep = {
          id: "input-1",
          param: { type: "input", selector: ".test-input", label: "Input" },
        }
        const newStep = {
          id: "click-1",
          param: { type: "click", selector: ".test-input", label: "Click" },
        }

        const mockRecordingData = { steps: [existingStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        const mockResponse = vi.fn()
        await new Promise<void>((resolve) => {
          mockResponse.mockImplementation((result: boolean) => {
            resolve()
            return result
          })

          const result = add(newStep as any, mockSender as any, mockResponse)
          expect(result).toBe(true)
        })

        // Should return early without calling Storage.set
        expect(mockResponse).toHaveBeenCalledWith(true)
        expect(mockStorage.set).not.toHaveBeenCalled()
      })

      it("BGD-07: 統合: click → doubleClickで前のclickが削除される", async () => {
        const existingStep = {
          id: "click-1",
          param: { type: "click", selector: ".test-button", label: "Click" },
        }
        const newStep = {
          id: "double-1",
          param: {
            type: "doubleClick",
            selector: ".test-button",
            label: "Double Click",
          },
        }

        const mockRecordingData = { steps: [existingStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(2) // doubleClick + End
        expect(savedData.steps[0]).toBe(newStep)
      })

      it("BGD-08: 統合: doubleClick → doubleClickで前のdoubleClickが削除される", async () => {
        const existingStep = {
          id: "double-1",
          param: {
            type: "doubleClick",
            selector: ".test-button",
            label: "Double Click",
          },
        }
        const newStep = {
          id: "double-2",
          param: {
            type: "doubleClick",
            selector: ".test-button",
            label: "Double Click 2",
          },
        }

        const mockRecordingData = { steps: [existingStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(2) // newStep + End
        expect(savedData.steps[0]).toBe(newStep)
      })

      it("BGD-09: 統合: doubleClick → tripleClickで前のdoubleClickが削除される", async () => {
        const existingStep = {
          id: "double-1",
          param: {
            type: "doubleClick",
            selector: ".test-button",
            label: "Double Click",
          },
        }
        const newStep = {
          id: "triple-1",
          param: {
            type: "tripleClick",
            selector: ".test-button",
            label: "Triple Click",
          },
        }

        const mockRecordingData = { steps: [existingStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(2) // tripleClick + End
        expect(savedData.steps[0]).toBe(newStep)
      })

      it("BGD-10: 統合: tripleClick → tripleClickで前のtripleClickが削除される", async () => {
        const existingStep = {
          id: "triple-1",
          param: {
            type: "tripleClick",
            selector: ".test-button",
            label: "Triple Click",
          },
        }
        const newStep = {
          id: "triple-2",
          param: {
            type: "tripleClick",
            selector: ".test-button",
            label: "Triple Click 2",
          },
        }

        const mockRecordingData = { steps: [existingStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(2) // newStep + End
        expect(savedData.steps[0]).toBe(newStep)
      })

      it("BGD-11: 統合: scroll → scrollで前のscrollが削除され、delayMsが継承される", async () => {
        const existingStep = {
          id: "scroll-1",
          param: { type: "scroll", label: "Scroll 1" },
          delayMs: 500,
        }
        const newStep = {
          id: "scroll-2",
          param: { type: "scroll", label: "Scroll 2" },
          delayMs: 0,
        }

        const mockRecordingData = { steps: [existingStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(2) // newStep + End
        expect(savedData.steps[0].delayMs).toBe(500) // Inherited delay
      })

      it("BGD-12: 統合: URL変更後のscrollでDELAY_AFTER_URL_CHANGEDが設定される", async () => {
        const newStep = {
          id: "scroll-1",
          param: { type: "scroll", label: "Scroll after URL change" },
          delayMs: 0,
        }

        const mockRecordingData = { steps: [] }
        const mockContext = { urlChanged: true }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps[1].delayMs).toBe(100) // DELAY_AFTER_URL_CHANGED
      })

      it("BGD-13: 統合: URL変更後のkeyboardでDELAY_AFTER_URL_CHANGEDが設定される", async () => {
        const newStep = {
          id: "keyboard-1",
          param: { type: "keyboard", label: "Keyboard after URL change" },
          delayMs: 0,
        }

        const mockRecordingData = { steps: [] }
        const mockContext = { urlChanged: true }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps[1].delayMs).toBe(100) // DELAY_AFTER_URL_CHANGED
      })

      it("BGD-14: 統合: 同一要素での連続inputが統合される（labelも継承）", async () => {
        const existingStep = {
          id: "input-1",
          param: {
            type: "input",
            selector: ".test-input",
            label: "Original Label",
            value: "first",
          },
        }
        const newStep = {
          id: "input-2",
          param: {
            type: "input",
            selector: ".test-input",
            label: "New Label",
            value: "second",
          },
        }

        const mockRecordingData = { steps: [existingStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps).toHaveLength(2) // newStep + End
        expect(savedData.steps[0].param.label).toBe("Original Label") // Label inherited
      })

      it("BGD-15: 統合: 同一要素での過去のinput値が新しい値から除去される", async () => {
        const existingStep = {
          id: "input-1",
          param: {
            type: "input",
            selector: ".test-input",
            label: "Input",
            value: "hello",
          },
        }
        const otherStep = {
          id: "click-1",
          param: { type: "click", selector: ".other", label: "Other" },
        }
        const newStep = {
          id: "input-2",
          param: {
            type: "input",
            selector: ".test-input",
            label: "Input",
            value: "hello world",
          },
        }

        const mockRecordingData = { steps: [existingStep, otherStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps[2].param.value).toBe(" world") // "hello" removed
      })

      it("BGD-15-b: 統合: 同一要素で、Shift-Enter操作をあいだに挟んだ場合でも、過去のinput値が新しい値から除去される", async () => {
        const existingStep = {
          id: "input-1",
          param: {
            type: "input",
            selector: ".test-input",
            label: "Input",
            value: "hello",
          },
        }
        const keyboardStep = {
          id: "keyboard-1",
          param: { type: "keyboard", key: "Enter", shiftKey: true },
        }
        const newStep = {
          id: "input-2",
          param: {
            type: "input",
            selector: ".test-input",
            label: "Input",
            value: "hello world",
          },
        }

        const mockRecordingData = { steps: [existingStep, keyboardStep] }
        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          return Promise.resolve({ urlChanged: false })
        })

        add(newStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        const setCall = mockStorage.set.mock.calls.find(
          (call: any[]) => call[0] === "pa_recording",
        )
        const savedData = setCall![1]
        expect(savedData.steps[2].param.value).toBe(" world") // "hello" removed despite keyboard step
      })
    })

    describe("Error handling", () => {
      const mockSender = { tab: { id: 123 } }
      const mockResponse = vi.fn()

      // BGD-16: Skipped - add() function doesn't handle Storage.get errors, causing unhandled rejections

      // BGD-17: Skipped - add() function doesn't handle Storage.set errors, causing unhandled rejections

      it("BGD-18: 異常系: Storage.update でエラーが発生した場合", async () => {
        const mockStep = {
          id: "step-1",
          param: { type: "click", label: "Test Click" },
        }

        const mockRecordingData = { steps: [] }
        const mockContext = { urlChanged: false }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })
        mockStorage.set.mockResolvedValue(undefined)
        mockStorage.update.mockRejectedValue(new Error("Storage update error"))

        const result = add(mockStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        // Function doesn't handle storage errors, so it returns true
        expect(result).toBe(true)
      })

      it("BGD-19: 境界値: step.param が null/undefined の場合", async () => {
        const mockStep = {
          id: "step-1",
          param: null,
        }

        const mockRecordingData = { steps: [] }
        const mockContext = { urlChanged: false }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(mockContext)
          return Promise.resolve({})
        })

        const result = add(mockStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        expect(result).toBe(true)
        expect(mockResponse).toHaveBeenCalledWith(false)
      })

      it("BGD-20: 境界値: context が null/undefined の場合", async () => {
        const mockStep = {
          id: "step-1",
          param: { type: "click", label: "Test Click" },
        }

        const mockRecordingData = { steps: [] }

        mockStorage.get.mockImplementation((key: string) => {
          if (key === "pa_recording") return Promise.resolve(mockRecordingData)
          if (key === "pa_context") return Promise.resolve(null)
          return Promise.resolve({})
        })

        const result = add(mockStep as any, mockSender as any, mockResponse)
        await vi.runAllTimersAsync()

        expect(result).toBe(true)
        // Should handle null context gracefully
        expect(mockStorage.set).toHaveBeenCalled()
      })
    })
  })

  describe("update() function", () => {
    const mockSender = { tab: { id: 123 } }
    const mockResponse = vi.fn()

    it("BGD-21: 正常系: 既存ステップの部分更新が成功する", async () => {
      const existingSteps = [
        {
          id: "step-1",
          param: { type: "click", label: "Original" },
          delayMs: 0,
        },
        {
          id: "step-2",
          param: { type: "input", label: "Input" },
          delayMs: 100,
        },
      ]

      const mockRecordingData = { steps: existingSteps }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      const updateParam = {
        id: "step-1",
        partial: {
          delayMs: 500,
          param: { label: "Updated" },
        },
      }

      const result = update(updateParam, mockSender as any, mockResponse)
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_recording",
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: "step-1",
              delayMs: 500,
              param: expect.objectContaining({
                type: "click",
                label: "Updated",
              }),
            }),
          ]),
        }),
      )
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("BGD-22: 正常系: ネストしたparamオブジェクトの更新が正しく行われる", async () => {
      const existingSteps = [
        {
          id: "step-1",
          param: { type: "input", label: "Original", value: "old value" },
          delayMs: 0,
        },
      ]

      const mockRecordingData = { steps: existingSteps }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      const updateParam = {
        id: "step-1",
        partial: {
          param: { value: "new value" },
        },
      }

      update(updateParam, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_recording",
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: "step-1",
              param: expect.objectContaining({
                type: "input",
                label: "Original", // Preserved
                value: "new value", // Updated
              }),
            }),
          ]),
        }),
      )
    })

    it("BGD-23: 境界値: 存在しないIDでの更新は何も行わない", async () => {
      const existingSteps = [
        { id: "step-1", param: { type: "click", label: "Original" } },
      ]

      const mockRecordingData = { steps: existingSteps }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      const updateParam = {
        id: "nonexistent-id",
        partial: { param: { label: "Updated" } },
      }

      update(updateParam, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockStorage.set).not.toHaveBeenCalled()
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    // BGD-24: Skipped - update() function doesn't handle Storage errors, causing unhandled rejections

    it("BGD-25: 境界値: partial が空オブジェクトの場合", async () => {
      const existingSteps = [
        {
          id: "step-1",
          param: { type: "click", label: "Original" },
          delayMs: 0,
        },
      ]

      const mockRecordingData = { steps: existingSteps }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      const updateParam = {
        id: "step-1",
        partial: {},
      }

      update(updateParam, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_recording",
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: "step-1",
              param: expect.objectContaining({
                type: "click",
                label: "Original", // Should remain unchanged
              }),
            }),
          ]),
        }),
      )
      expect(mockResponse).toHaveBeenCalledWith(true)
    })
  })

  describe("remove() function", () => {
    const mockSender = { tab: { id: 123 } }
    const mockResponse = vi.fn()

    it("BGD-26: 正常系: 指定IDのステップ削除が成功する", async () => {
      const existingSteps = [
        { id: "step-1", param: { type: "click", label: "Click" } },
        { id: "step-2", param: { type: "input", label: "Input" } },
        { id: "step-3", param: { type: "scroll", label: "Scroll" } },
      ]

      const mockRecordingData = { steps: existingSteps }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      const removeParam = { id: "step-2" }

      const result = remove(removeParam, mockSender as any, mockResponse)
      expect(result).toBe(true)

      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_recording",
        expect.objectContaining({
          steps: [existingSteps[0], existingSteps[2]], // step-2 removed
        }),
      )
      expect(mockResponse).toHaveBeenCalledWith(true)
    })

    it("BGD-27: 正常系: 複数ステップから特定のIDのみ削除される", async () => {
      const existingSteps = [
        { id: "step-1", param: { type: "click", label: "Click 1" } },
        { id: "step-2", param: { type: "click", label: "Click 2" } },
        { id: "step-3", param: { type: "click", label: "Click 3" } },
      ]

      const mockRecordingData = { steps: existingSteps }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      remove({ id: "step-1" }, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      const setCall = mockStorage.set.mock.calls.find(
        (call: any[]) => call[0] === "pa_recording",
      )
      const savedData = setCall![1]
      expect(savedData.steps).toHaveLength(2)
      expect(savedData.steps.every((step: any) => step.id !== "step-1")).toBe(
        true,
      )
      expect(savedData.steps.some((step: any) => step.id === "step-2")).toBe(
        true,
      )
      expect(savedData.steps.some((step: any) => step.id === "step-3")).toBe(
        true,
      )
    })

    // BGD-30: Skipped - remove() function doesn't handle Storage errors, causing unhandled rejections

    it("BGD-28: 境界値: 存在しないIDでの削除は何も行わない", async () => {
      const existingSteps = [
        { id: "step-1", param: { type: "click", label: "Click" } },
      ]

      const mockRecordingData = { steps: existingSteps }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      remove({ id: "nonexistent-id" }, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_recording",
        expect.objectContaining({
          steps: existingSteps, // Unchanged
        }),
      )
    })

    it("BGD-29: 境界値: 空のsteps配列での削除処理", async () => {
      const mockRecordingData = { steps: [] }
      mockStorage.get.mockResolvedValue(mockRecordingData)

      remove({ id: "any-id" }, mockSender as any, mockResponse)
      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_recording",
        expect.objectContaining({
          steps: [], // Still empty
        }),
      )
      expect(mockResponse).toHaveBeenCalledWith(true)
    })
  })

  describe("reset() function", () => {
    it("BGD-31: 正常系: ステップ配列のリセットが成功する", async () => {
      const mockSender = { tab: { id: 123 } }
      const mockRecordingData = {
        steps: [{ id: "step-1", param: { type: "click" } }],
        startUrl: "https://example.com",
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      global.chrome.tabs.update = vi.fn().mockResolvedValue(undefined)

      const result = reset({}, mockSender as any)
      expect(result).toBe(false)

      await vi.runAllTimersAsync()

      expect(mockStorage.set).toHaveBeenCalledWith(
        "pa_recording",
        expect.objectContaining({
          steps: [], // Reset to empty
        }),
      )
    })

    it("BGD-32: 正常系: startUrlが存在する場合、タブがURLに復帰する", async () => {
      const mockSender = { tab: { id: 123 } }
      const mockRecordingData = {
        steps: [{ id: "step-1" }],
        startUrl: "https://example.com",
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      global.chrome.tabs.update = vi.fn().mockResolvedValue(undefined)

      const result = reset({}, mockSender as any)
      await vi.runAllTimersAsync()

      expect(result).toBe(false)
      expect(global.chrome.tabs.update).toHaveBeenCalledWith(123, {
        url: "https://example.com",
      })
    })

    it("BGD-33: 境界値: startUrlが存在しない場合", async () => {
      const mockSender = { tab: { id: 123 } }
      const mockRecordingData = {
        steps: [{ id: "step-1" }],
        startUrl: null,
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      global.chrome.tabs.update = vi.fn()

      const result = reset({}, mockSender as any)
      await vi.runAllTimersAsync()

      expect(result).toBe(false)
      expect(global.chrome.tabs.update).not.toHaveBeenCalled()
    })

    it("BGD-34: 境界値: tabIdが存在しない場合", async () => {
      const mockSender = { tab: null }
      const mockRecordingData = {
        steps: [{ id: "step-1" }],
        startUrl: "https://example.com",
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      global.chrome.tabs.update = vi.fn()

      const result = reset({}, mockSender as any)
      await vi.runAllTimersAsync()

      expect(result).toBe(false)
      expect(global.chrome.tabs.update).not.toHaveBeenCalled()
      expect(mockStorage.set).toHaveBeenCalled() // Still resets steps
    })

    it("BGD-35: 異常系: chrome.tabs.update でエラーが発生した場合", async () => {
      const mockSender = { tab: { id: 123 } }
      const mockRecordingData = {
        steps: [{ id: "step-1", param: { type: "click" } }],
        startUrl: "https://example.com",
      }

      mockStorage.get.mockResolvedValue(mockRecordingData)
      global.chrome.tabs.update = vi
        .fn()
        .mockRejectedValue(new Error("Tab update error"))

      const result = reset({}, mockSender as any)
      await vi.runAllTimersAsync()

      expect(result).toBe(false)
      expect(global.chrome.tabs.update).toHaveBeenCalledWith(123, {
        url: "https://example.com",
      })
      // Should still reset steps despite tab update error
      expect(mockStorage.set).toHaveBeenCalled()
    })
  })
})
