import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { useForm, FormProvider } from "react-hook-form"
import { PAGE_ACTION_OPEN_MODE } from "@/const"
import { PageActionSection } from "../PageActionSection"

vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

vi.mock("@/hooks/option/useAiServiceForUrl", () => ({
  useAiServiceForUrl: () => undefined,
}))

// Heavy children are irrelevant to the start URL field.
vi.mock("@/components/pageAction/StepList", () => ({
  StepList: () => null,
}))
vi.mock("@/components/pageAction/InputEditor", () => ({
  InputEditor: () => null,
}))
vi.mock("@/components/option/RemoveDialog", () => ({
  RemoveDialog: () => null,
}))
vi.mock("@/components/option/field/UserVariablesField", () => ({
  UserVariablesField: () => null,
}))
vi.mock("@/components/option/field/OpenModeToggleField", () => ({
  OpenModeToggleField: () => null,
}))

function TestWrapper() {
  const form = useForm({
    defaultValues: {
      iconUrl: "",
      pageActionOption: {
        startUrl: "https://example.com/?q=%s",
        pageUrl: "",
        openMode: PAGE_ACTION_OPEN_MODE.POPUP,
        steps: [],
        userVariables: [],
      },
    },
  })
  return (
    <FormProvider {...form}>
      <PageActionSection form={form} openRecorder={() => {}} />
    </FormProvider>
  )
}

describe("PageActionSection", () => {
  it("PAS-01: 正常系: 開始URLの情報アイコンにホバーすると使用可能なプレースホルダーが表示される", async () => {
    render(<TestWrapper />)
    fireEvent.mouseEnter(screen.getByTestId("start-url-placeholders-tooltip"))
    expect(
      await screen.findByText("Option_urlPlaceholders_tooltip"),
    ).toBeDefined()
  })
})
