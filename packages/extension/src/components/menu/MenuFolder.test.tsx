import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { MenuFolder } from "./MenuFolder"
import { popupContext, ContextType } from "@/hooks/usePopupContext"
import { SIDE, ALIGN } from "@/const"
import type { ResolvedFolder } from "@/hooks/useSettingsWithImageCache"

// The rendered URL is the cached data URL; whether it may be recolored is
// resolved from the configured URL by useSettingsWithImageCache.
const cachedIconUrl = "data:image/png;base64,cached"

const renderFolder = (folder: ResolvedFolder) => {
  const fullContext: ContextType = {
    side: SIDE.top,
    align: ALIGN.start,
    hasIconColor: true,
  }
  const menuRef = { current: document.createElement("div") }

  return render(
    <popupContext.Provider value={fullContext}>
      <MenuFolder
        folder={folder}
        isHorizontal={false}
        side={SIDE.top}
        menuRef={menuRef}
        onHoverTrigger={() => {}}
        onHoverContent={() => {}}
        activeFolder=""
      />
    </popupContext.Provider>,
  )
}

describe("MenuFolder - Global Icon Color Exclusion", () => {
  it("keeps the original <img> for a folder whose icon keeps its own colors", () => {
    const { container } = renderFolder({
      id: "f1",
      title: "Folder",
      iconUrl: cachedIconUrl,
      preserveOriginalColor: true,
    })
    expect(container.querySelector("img")).not.toBeNull()
    expect(container.querySelector("span[style*='mask-image']")).toBeNull()
  })

  it("recolors a folder icon that is a generic UI icon", () => {
    const { container } = renderFolder({
      id: "f1",
      title: "Folder",
      iconUrl: cachedIconUrl,
      preserveOriginalColor: false,
    })
    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("span[style*='mask-image']")).not.toBeNull()
  })

  it("keeps the original <img> when the folder opts out manually", () => {
    const { container } = renderFolder({
      id: "f1",
      title: "Folder",
      iconUrl: cachedIconUrl,
      preserveOriginalColor: false,
      excludeFromGlobalIconColor: true,
    })
    expect(container.querySelector("img")).not.toBeNull()
  })
})
