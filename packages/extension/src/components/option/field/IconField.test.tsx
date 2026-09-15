import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm, FormProvider } from "react-hook-form"
import { IconField } from "./IconField"

// Mock useFavicon
vi.mock("@/hooks/option/useFavicon", () => ({
  useFavicon: () => ({ isLoading: false }),
}))

// Mock i18n
vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

function TestWrapper({ nameOverride }: { nameOverride?: string }) {
  const methods = useForm({
    defaultValues: {
      iconUrl: "https://example.com/icon.png",
      iconSvg: "",
      overrideGlobalIconColor: false,
      customOverrideField: false,
    },
  })

  return (
    <FormProvider {...methods}>
      <IconField
        control={methods.control}
        nameUrl="iconUrl"
        nameSvg="iconSvg"
        nameOverride={nameOverride}
        formLabel="Icon"
      />
    </FormProvider>
  )
}

describe("IconField Accessibility", () => {
  it("renders the override switch with id, htmlFor, and accessible name", () => {
    render(<TestWrapper />)
    const toggle = screen.getByRole("switch")
    expect(toggle).toBeDefined()
    expect(toggle.getAttribute("id")).toBe("overrideGlobalIconColor")
    expect(toggle.getAttribute("aria-label")).toBe("Option_overrideGlobalIconColor")

    const label = document.querySelector('label[for="overrideGlobalIconColor"]')
    expect(label).not.toBeNull()
  })

  it("supports custom nameOverride prop", () => {
    render(<TestWrapper nameOverride="customOverrideField" />)
    const toggle = screen.getByRole("switch")
    expect(toggle.getAttribute("id")).toBe("customOverrideField")

    const label = document.querySelector('label[for="customOverrideField"]')
    expect(label).not.toBeNull()
  })
})

