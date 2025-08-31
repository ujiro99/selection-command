import { useState } from "react"
import { isEmpty, cn } from "@/lib/utils"
import css from "./Menu.module.css"

type MenuImageProps = {
  src?: string
  svg?: string
  alt?: string
  className?: string
}

export function MenuImage(props: MenuImageProps): JSX.Element {
  const [svgElm, setSvgElm] = useState<HTMLDivElement | null>(null)
  const hasUrl = !isEmpty(props.src)
  const hasSvg = !isEmpty(props.svg)

  if (svgElm && props.svg) {
    svgElm.innerHTML = props.svg
  }

  return hasUrl ? (
    <img className={props.className} src={props.src} alt={props.alt} />
  ) : hasSvg ? (
    <div
      className={cn(css.menuImage, props.className)}
      style={{ color: "hsl(var(--foreground))" }}
      ref={setSvgElm}
    />
  ) : (
    <></>
  )
}
