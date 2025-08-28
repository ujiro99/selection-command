import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { SearchUrlAssistDialog } from "./SearchUrlAssistDialog"

// Mock Radix UI Dialog components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div data-testid="dialog" data-on-open-change={onOpenChange?.toString()}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: any) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
  DialogClose: ({ children, onClick }: any) => (
    <div data-testid="dialog-close" onClick={onClick}>
      {children}
    </div>
  ),
}))

// Mock Form components
vi.mock("@/components/ui/form", () => ({
  Form: ({ children }: any) => <form data-testid="form">{children}</form>,
  FormField: ({ render, name }: any) => {
    const field = {
      onChange: vi.fn(),
      onBlur: vi.fn(),
      value: name === "searchKeyword" ? "test" : "",
      name: name,
    }
    return <div data-testid={`form-field-${name}`}>{render({ field })}</div>
  },
  FormItem: ({ children }: any) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({ children }: any) => (
    <label data-testid="form-label" htmlFor="input">
      {children}
    </label>
  ),
  FormControl: ({ children }: any) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormMessage: ({ children }: any) => (
    <div data-testid="form-message">{children}</div>
  ),
}))

// Mock Input and Button components
vi.mock("@/components/ui/input", () => ({
  Input: ({ placeholder, ...props }: any) => (
    <input
      data-testid="input"
      id="input"
      placeholder={placeholder}
      {...props}
    />
  ),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  ),
}))

// Mock react-hook-form
vi.mock("react-hook-form", () => ({
  useForm: () => ({
    control: {},
    handleSubmit: (fn: any) => (e?: Event) => {
      e?.preventDefault?.()
      fn({
        searchKeyword: "test",
        searchResultUrl: "https://www.google.com/search?q=test",
      })
    },
    formState: { errors: {} },
  }),
}))

// Mock dependencies
vi.mock("@/services/i18n", () => ({
  t: vi.fn((key) => {
    const translations: Record<string, string> = {
      Option_searchUrlAssist_title: "Search URL Assist",
      Option_searchUrlAssist_desc:
        "Enter a search keyword and search result URL, and AI will generate a search URL template.",
      Option_searchUrlAssist_searchKeyword: "Search keyword",
      Option_searchUrlAssist_searchKeyword_placeholder: "e.g., test",
      Option_searchUrlAssist_searchResultUrl: "Search result page URL",
      Option_searchUrlAssist_searchResultUrl_placeholder:
        "https://www.google.com/search?q=test&...",
      Option_searchUrlAssist_howToUse: "How to use:",
      Option_searchUrlAssist_step1: "Enter any search keyword",
      Option_searchUrlAssist_step2:
        "Copy & paste the URL of the search results page for that keyword",
      Option_searchUrlAssist_step3:
        'Click "Execute with Gemini" to have AI generate a search URL template',
      Option_searchUrlAssist_step4:
        "Use the generated template in the search URL field of the command",
      Option_searchUrlAssist_executeButton: "Execute with Gemini",
      Option_searchUrlAssist_executing: "Launching...",
      Option_searchUrlAssist_validation_keyword_required:
        "Please enter a search keyword",
      Option_searchUrlAssist_validation_url_invalid: "Please enter a valid URL",
      Option_labelCancel: "Cancel",
    }
    return translations[key] || key
  }),
}))

vi.mock("@/services/ipc", () => ({
  Ipc: {
    send: vi.fn().mockResolvedValue({}),
  },
  BgCommand: {
    openAndRunPageAction: "openAndRunPageAction",
  },
}))

vi.mock("@/services/storage", () => ({
  Storage: {
    set: vi.fn().mockResolvedValue({}),
  },
  SESSION_STORAGE_KEY: {
    PA_RECORDING: "PA_RECORDING",
  },
}))

vi.mock("@/services/screen", () => ({
  getScreenSize: vi.fn().mockResolvedValue({
    width: 1920,
    height: 1080,
    top: 0,
    left: 0,
  }),
}))

vi.mock("@/const", async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    PAGE_ACTION_OPEN_MODE: {
      POPUP: "popup",
    },
    POPUP_OPTION: {
      width: 800,
      height: 600,
    },
  }
})

describe("SearchUrlAssistDialog", () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("SUD-01: renders dialog when open", () => {
    render(
      <SearchUrlAssistDialog open={true} onOpenChange={mockOnOpenChange} />,
    )

    expect(screen.getByText("Search URL Assist")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Enter a search keyword and search result URL, and AI will generate a search URL template.",
      ),
    ).toBeInTheDocument()
  })

  it("SUD-02: does not render dialog when closed", () => {
    render(
      <SearchUrlAssistDialog open={false} onOpenChange={mockOnOpenChange} />,
    )

    expect(screen.queryByText("Search URL Assist")).not.toBeInTheDocument()
  })

  it("SUD-03: renders form fields", () => {
    render(
      <SearchUrlAssistDialog open={true} onOpenChange={mockOnOpenChange} />,
    )

    expect(screen.getByLabelText("Search keyword")).toBeInTheDocument()
    expect(screen.getByLabelText("Search result page URL")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("e.g., test")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("https://www.google.com/search?q=test&..."),
    ).toBeInTheDocument()
  })

  it("SUD-04: renders usage instructions", () => {
    render(
      <SearchUrlAssistDialog open={true} onOpenChange={mockOnOpenChange} />,
    )

    expect(screen.getByText("How to use:")).toBeInTheDocument()
    expect(screen.getByText("Enter any search keyword")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Copy & paste the URL of the search results page for that keyword",
      ),
    ).toBeInTheDocument()
  })

  it("SUD-05: renders action buttons", () => {
    render(
      <SearchUrlAssistDialog open={true} onOpenChange={mockOnOpenChange} />,
    )

    expect(screen.getByText("Cancel")).toBeInTheDocument()
    expect(screen.getByText("Execute with Gemini")).toBeInTheDocument()
  })
})
