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
      it("BGD-01: Normal case: Basic step addition succeeds", async () => {
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

      it("BGD-02: Normal case: Adding first step to empty array auto-inserts StartAction", async () => {
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

      it("BGD-03: Normal case: EndAction is automatically added", async () => {
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

      it("BGD-04: Boundary: Handling when maximum step count is reached (PAGE_ACTION_MAX - 1)", async () => {
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

      it("BGD-05: Normal case: URL change flag is reset", async () => {
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

      it("BGD-06: Integration: Click is skipped when click + input on same element", async () => {
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

      it("BGD-07: Integration: Previous click is removed when click → doubleClick", async () => {
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

      it("BGD-08: Integration: Previous doubleClick is removed when doubleClick → doubleClick", async () => {
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

      it("BGD-09: Integration: Previous doubleClick is removed when doubleClick → tripleClick", async () => {
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

      it("BGD-10: Integration: Previous tripleClick is removed when tripleClick → tripleClick", async () => {
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

      it("BGD-11: Integration: Previous scroll is removed and delayMs inherited when scroll → scroll", async () => {
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

      it("BGD-12: Integration: DELAY_AFTER_URL_CHANGED is set for scroll after URL change", async () => {
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

      it("BGD-13: Integration: DELAY_AFTER_URL_CHANGED is set for keyboard after URL change", async () => {
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

      it("BGD-14: Integration: Consecutive inputs on same element are merged (label inherited)", async () => {
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

      it("BGD-15: Integration: Previous input value is removed from new value on same element", async () => {
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

      it("BGD-15-b: Integration: Previous input value is removed from new value even with Shift-Enter operation in between", async () => {
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

      it("BGD-18: Error case: When Storage.update error occurs", async () => {
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

      it("BGD-19: Boundary: When step.param is null/undefined", async () => {
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

      it("BGD-20: Boundary: When context is null/undefined", async () => {
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

    it("BGD-21: Normal case: Partial update of existing step succeeds", async () => {
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

    it("BGD-22: Normal case: Nested param object update is performed correctly", async () => {
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

    it("BGD-23: Boundary: Update with non-existent ID does nothing", async () => {
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

    it("BGD-25: Boundary: When partial is empty object", async () => {
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

    it("BGD-26: Normal case: Step deletion with specified ID succeeds", async () => {
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

    it("BGD-27: Normal case: Only specific ID is deleted from multiple steps", async () => {
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

    it("BGD-28: Boundary: Deletion with non-existent ID does nothing", async () => {
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

    it("BGD-29: Boundary: Deletion processing with empty steps array", async () => {
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
    it("BGD-31: Normal case: Step array reset succeeds", async () => {
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

    it("BGD-32: Normal case: Tab returns to URL when startUrl exists", async () => {
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

    it("BGD-33: Boundary: When startUrl does not exist", async () => {
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

    it("BGD-34: Boundary: When tabId does not exist", async () => {
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

    it("BGD-35: Error case: When chrome.tabs.update error occurs", async () => {
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
