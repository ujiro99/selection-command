import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useForm, FormProvider } from "react-hook-form"
import css from "@/components/menu/Menu.module.css"
import { IconField } from "./IconField"

// Mock useFavicon
vi.mock("@/hooks/option/useFavicon", () => ({
  useFavicon: () => ({ isLoading: false }),
}))

// Mock the global icon color, which is normally read from the saved settings.
const globalIconColor = {
  iconColor: undefined as string | undefined,
  hasIconColor: false,
}
vi.mock("@/hooks/option/useGlobalIconColor", () => ({
  useGlobalIconColor: () => globalIconColor,
}))

const setGlobalIconColor = (iconColor?: string) => {
  globalIconColor.iconColor = iconColor
  globalIconColor.hasIconColor = iconColor != null
}

beforeEach(() => {
  setGlobalIconColor(undefined)
})

// Mock i18n
vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

type TestWrapperProps = {
  initialValues?: {
    iconUrl?: string
    iconSvg?: string
    excludeFromGlobalIconColor?: boolean
    customExcludeField?: boolean
  }
  nameExclude?: string
  onSubmit?: (data: any) => void
}

function TestWrapper({
  initialValues,
  nameExclude,
  onSubmit,
}: TestWrapperProps) {
  const methods = useForm({
    defaultValues: {
      iconUrl: initialValues?.iconUrl ?? "https://example.com/icon.png",
      iconSvg: initialValues?.iconSvg ?? "",
      excludeFromGlobalIconColor:
        initialValues?.excludeFromGlobalIconColor ?? false,
      customExcludeField: initialValues?.customExcludeField ?? false,
    },
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onSubmit?.(data))}>
        <IconField
          control={methods.control}
          nameUrl="iconUrl"
          nameSvg="iconSvg"
          nameExclude={nameExclude}
          formLabel="Icon"
        />
        <button type="submit" data-testid="submit-btn">
          Submit
        </button>
      </form>
    </FormProvider>
  )
}

/** The explanation now lives in a tooltip, revealed by hovering the info icon. */
const findTooltipText = (text: string) => {
  fireEvent.mouseEnter(screen.getByTestId("exclude-icon-color-info"))
  return screen.findByText(text)
}

describe("IconField - Global Icon Color Exclusion", () => {
  const faviconUrl = "https://www.google.com/favicon.ico"
  const nonFaviconUrl = "https://cdn3.iconfinder.com/icon.png"
  const googleServiceIcon =
    "https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_32dp.png"

  describe("Accessibility and basics", () => {
    it("renders the exclude switch with id, htmlFor, and accessible name", () => {
      render(<TestWrapper />)
      const toggle = screen.getByRole("switch")
      expect(toggle).toBeDefined()
      expect(toggle.getAttribute("id")).toBe("excludeFromGlobalIconColor")
      expect(toggle.getAttribute("aria-label")).toBe(
        "Option_excludeFromGlobalIconColor",
      )

      const label = document.querySelector(
        'label[for="excludeFromGlobalIconColor"]',
      )
      expect(label).not.toBeNull()
    })

    it("supports custom nameExclude prop", () => {
      render(<TestWrapper nameExclude="customExcludeField" />)
      const toggle = screen.getByRole("switch")
      expect(toggle.getAttribute("id")).toBe("customExcludeField")

      const label = document.querySelector('label[for="customExcludeField"]')
      expect(label).not.toBeNull()
    })
  })

  describe("Automatic favicon exclusion", () => {
    it("disables manual toggle and shows automatic status for a website favicon", async () => {
      render(
        <TestWrapper
          initialValues={{
            iconUrl: faviconUrl,
            excludeFromGlobalIconColor: false,
          }}
        />,
      )

      const toggle = screen.getByRole("switch")
      expect(toggle).toBeDisabled()
      expect(toggle).toBeChecked()

      // Automatic badge should be present
      const badge = screen.getByTestId("favicon-automatic-badge")
      expect(badge).toBeDefined()
      expect(badge.textContent).toBe(
        "Option_excludeFromGlobalIconColor_automatic",
      )

      // Explanation for automatic favicon exclusion
      expect(
        await findTooltipText("Option_excludeFromGlobalIconColor_favicon_desc"),
      ).toBeDefined()
    })

    it("disables manual toggle and shows automatic status for a Google service icon", async () => {
      render(
        <TestWrapper
          initialValues={{
            iconUrl: googleServiceIcon,
            excludeFromGlobalIconColor: false,
          }}
        />,
      )

      const toggle = screen.getByRole("switch")
      expect(toggle).toBeDisabled()
      expect(toggle).toBeChecked()

      expect(screen.getByTestId("favicon-automatic-badge")).toBeDefined()
      expect(
        await findTooltipText("Option_excludeFromGlobalIconColor_favicon_desc"),
      ).toBeDefined()
    })

    it("enables manual toggle and shows default description for non-favicon icon", async () => {
      render(
        <TestWrapper
          initialValues={{
            iconUrl: nonFaviconUrl,
            excludeFromGlobalIconColor: false,
          }}
        />,
      )

      const toggle = screen.getByRole("switch")
      expect(toggle).toBeEnabled()
      expect(toggle).not.toBeChecked()

      expect(screen.queryByTestId("favicon-automatic-badge")).toBeNull()
      expect(
        await findTooltipText("Option_excludeFromGlobalIconColor_desc"),
      ).toBeDefined()
    })
  })

  describe("Dynamic URL changes and state preservation", () => {
    it("updates automatic/manual control availability when URL changes between favicon and non-favicon", () => {
      render(
        <TestWrapper
          initialValues={{
            iconUrl: faviconUrl,
            excludeFromGlobalIconColor: false,
          }}
        />,
      )

      const urlInput = screen.getByRole("textbox")
      const toggle = screen.getByRole("switch")

      // 1. Initial state with favicon: disabled & checked
      expect(toggle).toBeDisabled()
      expect(toggle).toBeChecked()
      expect(screen.getByTestId("favicon-automatic-badge")).toBeDefined()

      // 2. Change URL to non-favicon -> toggle becomes available, restores saved false
      fireEvent.change(urlInput, { target: { value: nonFaviconUrl } })
      expect(toggle).toBeEnabled()
      expect(toggle).not.toBeChecked()
      expect(screen.queryByTestId("favicon-automatic-badge")).toBeNull()

      // 3. Manually toggle to true
      fireEvent.click(toggle)
      expect(toggle).toBeChecked()

      // 4. Change URL back to favicon -> toggle becomes disabled, shows automatic
      fireEvent.change(urlInput, { target: { value: faviconUrl } })
      expect(toggle).toBeDisabled()
      expect(toggle).toBeChecked()
      expect(screen.getByTestId("favicon-automatic-badge")).toBeDefined()

      // 5. Change URL back to non-favicon -> toggle becomes enabled, previous manual true is retained
      fireEvent.change(urlInput, { target: { value: nonFaviconUrl } })
      expect(toggle).toBeEnabled()
      expect(toggle).toBeChecked()
    })

    it("does not overwrite saved manual preference when icon is a favicon and submitted", async () => {
      const handleSubmit = vi.fn()
      render(
        <TestWrapper
          initialValues={{
            iconUrl: faviconUrl,
            excludeFromGlobalIconColor: false,
          }}
          onSubmit={handleSubmit}
        />,
      )

      fireEvent.click(screen.getByTestId("submit-btn"))

      // The submitted data must have excludeFromGlobalIconColor: false
      // Automatic favicon exclusion must NOT permanently mutate the stored field
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            iconUrl: faviconUrl,
            excludeFromGlobalIconColor: false,
          }),
        )
      })
    })

    it("restores correct state when reopening with favicon vs non-favicon saved values", () => {
      // Scenario A: Saved command with favicon URL and false manual setting
      const { unmount } = render(
        <TestWrapper
          initialValues={{
            iconUrl: faviconUrl,
            excludeFromGlobalIconColor: false,
          }}
        />,
      )
      expect(screen.getByRole("switch")).toBeDisabled()
      expect(screen.getByRole("switch")).toBeChecked()
      unmount()

      // Scenario B: Saved command with non-favicon URL and true manual setting
      render(
        <TestWrapper
          initialValues={{
            iconUrl: nonFaviconUrl,
            excludeFromGlobalIconColor: true,
          }}
        />,
      )
      expect(screen.getByRole("switch")).toBeEnabled()
      expect(screen.getByRole("switch")).toBeChecked()
    })
  })
})

describe("IconField - Icon preview", () => {
  const uiIconUrl = "https://cdn3.iconfinder.com/icon.png"
  const faviconUrl = "https://www.google.com/favicon.ico"
  const iconColor = "#FF0000"

  const previewImg = () => document.querySelector("form img")
  const previewMask = () => document.querySelector("form span[role='img']")

  it("renders a plain <img> preview while no global icon color is set", () => {
    render(<TestWrapper initialValues={{ iconUrl: uiIconUrl }} />)
    expect(previewImg()?.getAttribute("src")).toBe(uiIconUrl)
    expect(previewMask()).toBeNull()
  })

  it("paints the preview with the global icon color", () => {
    setGlobalIconColor(iconColor)
    render(<TestWrapper initialValues={{ iconUrl: uiIconUrl }} />)

    const mask = previewMask()
    expect(mask).not.toBeNull()
    expect(mask?.classList.contains(css.itemImgMasked)).toBe(true)
    expect(mask?.getAttribute("style")).toContain(uiIconUrl)
    // The variable the mask is painted with is provided around the preview.
    expect(
      (
        document.querySelector("form div[style]") as HTMLElement | null
      )?.style.getPropertyValue("--sc-icon-color"),
    ).toBe(iconColor)
  })

  it("keeps the original colors of an automatically preserved favicon", () => {
    setGlobalIconColor(iconColor)
    render(<TestWrapper initialValues={{ iconUrl: faviconUrl }} />)
    expect(previewImg()?.getAttribute("src")).toBe(faviconUrl)
    expect(previewMask()).toBeNull()
  })

  it("follows the exclude toggle in real time", () => {
    setGlobalIconColor(iconColor)
    render(<TestWrapper initialValues={{ iconUrl: uiIconUrl }} />)
    expect(previewMask()).not.toBeNull()

    // Turning the toggle on restores the original colors right away.
    fireEvent.click(screen.getByRole("switch"))
    expect(previewMask()).toBeNull()
    expect(previewImg()?.getAttribute("src")).toBe(uiIconUrl)

    // Turning it off paints the preview with the global color again.
    fireEvent.click(screen.getByRole("switch"))
    expect(previewMask()).not.toBeNull()
  })
})
