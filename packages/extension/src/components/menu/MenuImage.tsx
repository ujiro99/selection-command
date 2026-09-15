import { useState } from "react"
import { isEmpty, cn } from "@/lib/utils"
import { isFaviconIcon } from "@/lib/favicon"
import { usePopupContext } from "@/hooks/usePopupContext"
import css from "./Menu.module.css"

type MenuImageProps = {
  src?: string
  svg?: string
  alt?: string
  className?: string
  overrideGlobalIconColor?: boolean
  isFavicon?: boolean
}

export function MenuImage(props: MenuImageProps): JSX.Element {
  const [svgElm, setSvgElm] = useState<HTMLDivElement | null>(null)
  const { hasIconColor } = usePopupContext()
  const hasUrl = !isEmpty(props.src)
  const hasSvg = !isEmpty(props.svg)

  const isFavicon =
    props.isFavicon ?? (hasUrl ? isFaviconIcon({ url: props.src }) : false)

  const isRecolorActive = Boolean(
    hasIconColor && !props.overrideGlobalIconColor && !isFavicon,
  )

  if (svgElm && props.svg) {
    svgElm.innerHTML = props.svg
  }

  const isDecorative = !props.alt || props.alt.trim() === ""

  return hasUrl ? (
    isRecolorActive ? (
      <span
        className={cn(css.itemImg, css.itemImgMasked, props.className)}
        style={{
          WebkitMaskImage: `url("${props.src}")`,
          maskImage: `url("${props.src}")`,
          backgroundColor: "var(--sc-icon-color)",
        }}
        {...(isDecorative
          ? { "aria-hidden": "true" }
          : { role: "img", "aria-label": props.alt })}
      />
    ) : (
      <img
        className={props.className}
        src={props.src}
        alt={props.alt || ""}
        {...(isDecorative ? { "aria-hidden": "true" } : {})}
      />
    )
  ) : hasSvg ? (
    <div
      className={cn(css.menuImage, props.className)}
      style={{
        color: isRecolorActive
          ? "var(--sc-icon-color)"
          : "hsl(var(--foreground))",
      }}
      ref={setSvgElm}
      {...(isDecorative
        ? { "aria-hidden": "true" }
        : { role: "img", "aria-label": props.alt })}
    />
  ) : (
    <></>
  )
}
