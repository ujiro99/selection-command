import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { MenuFolder } from "./MenuFolder"
import { IconUrlsContext } from "./iconUrls"
import { popupContext, ContextType } from "@/hooks/usePopupContext"
import { SIDE, ALIGN } from "@/const"
import type { CommandFolder } from "@/types"

const cachedIconUrl = "data:image/png;base64,cached"

const renderFolder = (
  folder: CommandFolder,
  folderIconUrls: Record<string, string> = {},
) => {
  const fullContext: ContextType = {
    side: SIDE.top,
    align: ALIGN.start,
    hasIconColor: true,
  }
  const menuRef = { current: document.createElement("div") }

  return render(
    <popupContext.Provider value={fullContext}>
      <IconUrlsContext.Provider
        value={{ commands: {}, folders: folderIconUrls }}
      >
        <MenuFolder
          folder={folder}
          isHorizontal={false}
          side={SIDE.top}
          menuRef={menuRef}
          onHoverTrigger={() => {}}
          onHoverContent={() => {}}
          activeFolder=""
        />
      </IconUrlsContext.Provider>
    </popupContext.Provider>,
  )
}

describe("MenuFolder - Global Icon Color Exclusion", () => {
  it("keeps the original <img> for a folder whose configured icon is a favicon", () => {
    // The rendered URL is the cached data URL, so detection must use the original.
    const { container } = renderFolder(
      { id: "f1", title: "Folder", iconUrl: cachedIconUrl },
      { f1: "https://www.google.com/favicon.ico" },
    )
    expect(container.querySelector("img")).not.toBeNull()
    expect(container.querySelector("span[style*='mask-image']")).toBeNull()
  })

  it("recolors a folder icon that is a generic UI icon", () => {
    const { container } = renderFolder(
      { id: "f1", title: "Folder", iconUrl: cachedIconUrl },
      { f1: "https://cdn3.iconfinder.com/data/icons/feather-5/24/folder.png" },
    )
    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("span[style*='mask-image']")).not.toBeNull()
  })

  it("keeps the original <img> when the folder opts out manually", () => {
    const { container } = renderFolder(
      {
        id: "f1",
        title: "Folder",
        iconUrl: cachedIconUrl,
        excludeFromGlobalIconColor: true,
      },
      { f1: "https://cdn3.iconfinder.com/data/icons/feather-5/24/folder.png" },
    )
    expect(container.querySelector("img")).not.toBeNull()
  })
})
