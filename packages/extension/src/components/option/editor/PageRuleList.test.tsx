import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import userEvent from "@testing-library/user-event"
import { useForm, FormProvider } from "react-hook-form"
import { PageRuleList } from "./PageRuleList"
import { sendEvent } from "@/services/analytics"
import { LINK_COMMAND_ENABLED, POPUP_ENABLED, INHERIT } from "@/const"
import { TEST_IDS } from "@/testIds"
import type { PageRule } from "@/types"

// Use the real ANALYTICS_EVENTS/PAGE_RULE_CREATE constant so this test also
// verifies PageRuleList sends the right event name, while keeping the
// network-calling sendEvent stubbed out.
vi.mock("@/services/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/analytics")>()
  return {
    ...actual,
    sendEvent: vi.fn(),
  }
})

const mockSendEvent = vi.mocked(sendEvent)

const existingRule: PageRule = {
  urlPattern: "https://existing.example.com",
  popupEnabled: POPUP_ENABLED.ENABLE,
  popupPlacement: INHERIT,
  linkCommandEnabled: LINK_COMMAND_ENABLED.INHERIT,
}

function Wrapper({ pageRules = [] }: { pageRules?: PageRule[] }) {
  const methods = useForm({
    defaultValues: { pageRules },
  })
  return (
    <FormProvider {...methods}>
      <PageRuleList
        control={methods.control}
        linkCommandEnabled={LINK_COMMAND_ENABLED.INHERIT}
      />
    </FormProvider>
  )
}

describe("PageRuleList: page_rule_create analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("PR-01: sends page_rule_create when a new page rule is created", async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByTestId(TEST_IDS.pageRuleAddButton))
    // PageRuleDialog resets its form to DefaultRule via a 200ms setTimeout
    // before the fields are usable; wait for it before typing.
    await act(() => new Promise((resolve) => setTimeout(resolve, 250)))
    await user.type(
      screen.getByTestId(TEST_IDS.pageRuleUrlPatternInput),
      "https://example.com",
    )
    await user.click(screen.getByTestId(TEST_IDS.pageRuleSaveButton))

    expect(mockSendEvent).toHaveBeenCalledWith("page_rule_create", {}, "Option")
  })

  it("PR-02: does not send page_rule_create when an existing page rule is edited", async () => {
    const user = userEvent.setup()
    render(<Wrapper pageRules={[existingRule]} />)

    await user.click(screen.getByTestId(TEST_IDS.pageRuleEditButton))
    // Submit without changing the URL pattern, so upsert() matches the
    // existing rule and takes the update branch instead of create.
    await user.click(screen.getByTestId(TEST_IDS.pageRuleSaveButton))

    expect(mockSendEvent).not.toHaveBeenCalledWith(
      "page_rule_create",
      expect.anything(),
      expect.anything(),
    )
  })
})
