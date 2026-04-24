import { useRef, useState } from "react"
import { Menubar } from "@/components/ui/menubar"

import { STYLE, SIDE } from "@/const"
import { TEST_IDS } from "@/testIds"
import { useSettingsWithImageCache } from "@/hooks/useSettings"
import { cn, isMenuCommand } from "@/lib/utils"
import { toCommandTree } from "@/services/option/commandTree"
import css from "./Menu.module.css"
import { MenuTreeNode } from "./MenuFolder"

export function Menu(): JSX.Element {
  const menuRef = useRef(null)
  const [hoverTrigger, setHoverTrigger] = useState("")
  const [hoverContent, setHoverContent] = useState("")
  const { commands, folders, userSettings } = useSettingsWithImageCache()
  const isHorizontal = userSettings.style === STYLE.HORIZONTAL
  const side = userSettings.popupPlacement?.side ?? SIDE.top

  const commandTree = toCommandTree(commands.filter(isMenuCommand), folders)
  const activeFolder = hoverTrigger || hoverContent

  return (
    <Menubar
      value={activeFolder}
      className={cn({
        [css.menuVertical]: !isHorizontal,
      })}
      ref={menuRef}
      data-testid={TEST_IDS.menuBar}
    >
      {commandTree.map((node) => (
        <MenuTreeNode
          key={node.content.id}
          node={node}
          isHorizontal={isHorizontal}
          side={side}
          menuRef={menuRef}
          onHoverTrigger={setHoverTrigger}
          onHoverContent={setHoverContent}
        />
      ))}
    </Menubar>
  )
}
