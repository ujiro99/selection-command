import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { PromptHistoryBanner } from "./PromptHistoryBanner"
import { Settings } from "@/services/settings/settings"

// Mock i18n
vi.mock("@/services/i18n", () => ({
  t: vi.fn((key) => {
    const translations: Record<string, string> = {
      prompthistory_banner_description: "Manage your AI prompts easily",
    }
    return translations[key] || key
  }),
}))

// Mock Settings
vi.mock("@/services/settings/settings", () => ({
  Settings: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

const mockSettings = vi.mocked(Settings)

describe("PromptHistoryBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("PHB-01: Initial display control", () => {
    it("PHB-01-a: Banner is displayed when hasDismissedPromptHistoryBanner is false", async () => {
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: false,
      } as any)

      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })
    })

    it("PHB-01-b: Banner is displayed when hasDismissedPromptHistoryBanner is undefined", async () => {
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: undefined,
      } as any)

      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })
    })

    it("PHB-01-c: Banner is not displayed when hasDismissedPromptHistoryBanner is true", async () => {
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: true,
      } as any)

      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.queryByRole("link")).not.toBeInTheDocument()
      })
    })
  })

  describe("PHB-02: Banner content", () => {
    beforeEach(() => {
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: false,
      } as any)
    })

    it("PHB-02-a: Correct URL is set for the link", async () => {
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        const link = screen.getByRole("link")
        expect(link).toHaveAttribute(
          "href",
          "https://ujiro99.github.io/prompt-history/?utm_source=selection-command&utm_medium=extension&utm_campaign=banner-announcement",
        )
      })
    })

    it("PHB-02-b: Link opens in a new tab", async () => {
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        const link = screen.getByRole("link")
        expect(link).toHaveAttribute("target", "_blank")
        expect(link).toHaveAttribute("rel", "noopener noreferrer")
      })
    })

    it("PHB-02-c: Image is displayed", async () => {
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        const image = screen.getByAltText("Prompt History")
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute("src", "/PromptHistory.png")
      })
    })

    it("PHB-02-d: Description text is displayed", async () => {
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(
          screen.getByText("Manage your AI prompts easily"),
        ).toBeInTheDocument()
      })
    })

    it("PHB-02-e: Close button is displayed", async () => {
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        const closeButton = screen.getByRole("button", {
          name: /close banner/i,
        })
        expect(closeButton).toBeInTheDocument()
      })
    })
  })

  describe("PHB-03: Close button behavior", () => {
    beforeEach(() => {
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: false,
      } as any)
      mockSettings.update.mockResolvedValue(true)
    })

    it("PHB-03-a: Banner is hidden when close button is clicked", async () => {
      const user = userEvent.setup()
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })

      const closeButton = screen.getByRole("button", {
        name: /close banner/i,
      })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole("link")).not.toBeInTheDocument()
      })
    })

    it("PHB-03-b: Settings.update is called when close button is clicked", async () => {
      const user = userEvent.setup()
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })

      const closeButton = screen.getByRole("button", {
        name: /close banner/i,
      })
      await user.click(closeButton)

      await waitFor(() => {
        expect(mockSettings.update).toHaveBeenCalledOnce()
        expect(mockSettings.update).toHaveBeenCalledWith(
          "hasDismissedPromptHistoryBanner",
          expect.any(Function),
        )
      })
    })

    it("PHB-03-c: Updater function passed to Settings.update returns true", async () => {
      const user = userEvent.setup()
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })

      const closeButton = screen.getByRole("button", {
        name: /close banner/i,
      })
      await user.click(closeButton)

      await waitFor(() => {
        expect(mockSettings.update).toHaveBeenCalled()
      })

      // Extract the updater function from the call
      const updateCall = mockSettings.update.mock.calls[0]
      const updaterFunction = updateCall[1] as () => boolean
      const result = updaterFunction()

      expect(result).toBe(true)
    })

    it("PHB-03-d: Close button click event does not propagate to parent element", async () => {
      const user = userEvent.setup()
      const linkClickHandler = vi.fn()

      render(
        <div onClick={linkClickHandler}>
          <PromptHistoryBanner />
        </div>,
      )

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })

      const closeButton = screen.getByRole("button", {
        name: /close banner/i,
      })
      await user.click(closeButton)

      // The link handler should not be called due to stopPropagation
      expect(linkClickHandler).not.toHaveBeenCalled()
    })
  })

  describe("PHB-04: Settings persistence", () => {
    it("PHB-04-a: Once dismissed, banner is not displayed on remount", async () => {
      const user = userEvent.setup()

      // First render with dismissed=false
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: false,
      } as any)
      mockSettings.update.mockResolvedValue(true)

      const { unmount } = render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })

      // Click close button
      const closeButton = screen.getByRole("button", {
        name: /close banner/i,
      })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole("link")).not.toBeInTheDocument()
      })

      // Unmount the component
      unmount()

      // Re-render with dismissed=true (simulating persistent storage)
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: true,
      } as any)

      render(<PromptHistoryBanner />)

      // The banner should not appear
      await waitFor(() => {
        expect(screen.queryByRole("link")).not.toBeInTheDocument()
      })
    })
  })

  describe("PHB-05: Error handling", () => {
    it("PHB-05-a: Banner is not displayed when Settings.get throws an error", async () => {
      mockSettings.get.mockRejectedValue(new Error("Storage error"))

      render(<PromptHistoryBanner />)

      // Wait a bit to ensure async operations complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(screen.queryByRole("link")).not.toBeInTheDocument()
    })

    it("PHB-05-b: UI remains visible when Settings.update throws an error", async () => {
      const user = userEvent.setup()
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: false,
      } as any)
      mockSettings.update.mockRejectedValue(new Error("Update error"))

      render(<PromptHistoryBanner />)

      await waitFor(() => {
        expect(screen.getByRole("link")).toBeInTheDocument()
      })

      const closeButton = screen.getByRole("button", {
        name: /close banner/i,
      })
      await user.click(closeButton)

      // If update fails, the banner should remain visible
      // Wait a bit to ensure async operations complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(screen.getByRole("link")).toBeInTheDocument()
    })
  })

  describe("PHB-06: Accessibility", () => {
    beforeEach(() => {
      mockSettings.get.mockResolvedValue({
        hasDismissedPromptHistoryBanner: false,
      } as any)
    })

    it("PHB-06-a: Close button has appropriate aria-label", async () => {
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        const closeButton = screen.getByRole("button", {
          name: /close banner/i,
        })
        expect(closeButton).toHaveAttribute("aria-label", "Close banner")
      })
    })

    it("PHB-06-b: Close button has type set to button", async () => {
      render(<PromptHistoryBanner />)

      await waitFor(() => {
        const closeButton = screen.getByRole("button", {
          name: /close banner/i,
        })
        expect(closeButton).toHaveAttribute("type", "button")
      })
    })
  })
})
