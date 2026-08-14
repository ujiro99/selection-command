import React from "react"
import { render } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { Option } from "./Option"
import { sendEvent } from "@/services/analytics"

vi.mock("@/services/settings/settings", () => ({
  Settings: {
    addChangedListener: vi.fn(),
    removeChangedListener: vi.fn(),
  },
}))

vi.mock("@/components/Popup", () => ({ Popup: () => null }))
vi.mock("@/components/option/TableOfContents", () => ({
  TableOfContents: () => null,
}))
vi.mock("@/components/option/ImportExport", () => ({
  ImportExport: () => null,
}))
vi.mock("@/components/option/UserSupport", () => ({ UserSupport: () => null }))
vi.mock("@/components/option/DeveloperSupport", () => ({
  DeveloperSupport: () => null,
}))
vi.mock("@/components/option/HubBanner", () => ({ HubBanner: () => null }))
vi.mock("@/components/option/HubUserInfo", () => ({ HubUserInfo: () => null }))
vi.mock("@/components/option/SettingForm", () => ({ SettingForm: () => null }))
vi.mock("@/components/option/StorageUsage", () => ({ default: () => null }))

vi.mock("@/services/analytics", () => ({
  ANALYTICS_EVENTS: {
    OPTION_SCREEN_OPENED: "option_screen_opened",
  },
  sendEvent: vi.fn(),
}))

const mockSendEvent = vi.mocked(sendEvent)

describe("Option: option_screen_opened analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("OPT-01: sends the event exactly once on mount", () => {
    render(<Option />)

    expect(mockSendEvent).toHaveBeenCalledTimes(1)
    expect(mockSendEvent).toHaveBeenCalledWith(
      "option_screen_opened",
      {},
      "Option",
    )
  })

  it("OPT-02: still sends the event only once under StrictMode's double effect invocation", () => {
    render(
      <React.StrictMode>
        <Option />
      </React.StrictMode>,
    )

    expect(mockSendEvent).toHaveBeenCalledTimes(1)
  })
})
