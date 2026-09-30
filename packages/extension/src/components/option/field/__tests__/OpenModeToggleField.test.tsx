import { describe, it, expect, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { OPEN_MODE } from "@/const"
import { OpenModeToggleField } from "../OpenModeToggleField"

const originalSidePanel = chrome.sidePanel

// Replace chrome.sidePanel to emulate browsers with/without the API.
const setSidePanel = (value: unknown) => {
  ;(chrome as unknown as { sidePanel: unknown }).sidePanel = value
}

const disableSidePanelApi = () => setSidePanel(undefined)

describe("OpenModeToggleField rendering", () => {
  const TestForm = ({ openMode }: { openMode: string }) => {
    const form = useForm({ defaultValues: { openMode } })
    return (
      <Form {...form}>
        <OpenModeToggleField
          control={form.control}
          name="openMode"
          formLabel="Open mode"
          type="search"
        />
      </Form>
    )
  }

  const getSidePanelItem = () =>
    screen.queryByRole("radio", { name: "Option_openMode_sidePanel" })

  afterEach(() => {
    setSidePanel(originalSidePanel)
  })

  it("OM-09: SIDE_PANEL item is enabled when supported", () => {
    render(<TestForm openMode={OPEN_MODE.POPUP} />)

    expect(getSidePanelItem()).not.toBeNull()
    expect(getSidePanelItem()).not.toBeDisabled()
  })

  it("OM-10: SIDE_PANEL item is hidden when not supported and not selected", () => {
    disableSidePanelApi()
    render(<TestForm openMode={OPEN_MODE.POPUP} />)

    expect(getSidePanelItem()).toBeNull()
  })

  it("OM-11: SIDE_PANEL item is shown as disabled when not supported but selected", () => {
    disableSidePanelApi()
    render(<TestForm openMode={OPEN_MODE.SIDE_PANEL} />)

    expect(getSidePanelItem()).not.toBeNull()
    expect(getSidePanelItem()).toBeDisabled()
  })
})
