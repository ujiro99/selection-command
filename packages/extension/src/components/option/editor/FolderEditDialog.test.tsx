import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FolderEditDialog } from "./FolderEditDialog"
import type { CommandFolder } from "@/types"

vi.mock("@/services/i18n", () => ({
  t: (key: string) => key,
}))

vi.mock("@/hooks/option/useFavicon", () => ({
  useFavicon: () => ({ isLoading: false }),
}))

vi.mock("@/hooks/option/useGlobalIconColor", () => ({
  useGlobalIconColor: () => ({ iconColor: undefined, hasIconColor: false }),
}))

const renderDialog = (folder: CommandFolder, onSubmit = vi.fn()) => {
  render(
    <FolderEditDialog
      open={true}
      onOpenChange={vi.fn()}
      onSubmit={onSubmit}
      folder={folder}
      folders={[folder]}
    />,
  )
  return onSubmit
}

const iconInput = () =>
  screen.getByPlaceholderText("Option_icon_placeholder") as HTMLInputElement

const save = () => fireEvent.click(screen.getByText("Option_labelUpdate"))

describe("FolderEditDialog", () => {
  const svg = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z" /></svg>'

  it("keeps an iconSvg-only folder's icon instead of the default iconUrl", () => {
    renderDialog({ id: "f1", title: "SVG folder", iconSvg: svg })
    expect(iconInput().value).toBe(svg)
  })

  it("keeps a folder's own iconUrl", () => {
    const iconUrl = "https://example.com/folder.png"
    renderDialog({ id: "f2", title: "URL folder", iconUrl })
    expect(iconInput().value).toBe(iconUrl)
  })

  it("does not turn unset properties into defaults on save", async () => {
    const onSubmit = renderDialog({
      id: "f3",
      title: "SVG folder",
      iconSvg: svg,
    })
    save()

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.iconSvg).toBe(svg)
    expect(submitted.iconUrl).toBe("")
    expect(submitted.onlyIcon).toBe(false)
    // The property this branch adds is the one that gets filled in.
    expect(submitted.excludeFromGlobalIconColor).toBe(false)
  })
})
