import { MenuImage, type MenuImageProps } from "@/components/menu/MenuImage"
import { useThemeContext } from "@/hooks/useTheme"
import { shouldPreserveIconColor } from "@/lib/favicon"
import type { Command } from "@/types"

type Props = MenuImageProps & {
  /** The command the icon belongs to, to keep its website's own icons. */
  command?: Command
}

/**
 * MenuImage for the option page, outside the popup. In the dark theme it
 * recolors icons like the popup does (see Popup), since the black glyph icons
 * would vanish on the dark background. Favicons and brand icons keep their
 * colors.
 */
export function OptionMenuImage({ command, ...props }: Props): JSX.Element {
  const isDark = useThemeContext() === "dark"
  const preserveOriginalColor =
    props.preserveOriginalColor ??
    shouldPreserveIconColor({ url: props.src, command })
  return (
    <MenuImage
      {...props}
      recolor={isDark}
      preserveOriginalColor={preserveOriginalColor}
    />
  )
}
