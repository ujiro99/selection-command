import { useState } from "react"
import { isEmpty, cn } from "@/lib/utils"
import { usePopupContext } from "@/hooks/usePopupContext"
import css from "./Menu.module.css"

type MenuImageProps = {
  src?: string
  svg?: string
  alt?: string
  className?: string
  excludeFromGlobalIconColor?: boolean
  /**
   * Whether the icon keeps its own colors. Decided by the caller, which knows
   * the icon's origin: deciding it here would mean importing the Public Suffix
   * List into every page the content script runs on.
   */
  preserveOriginalColor?: boolean
}

/** An icon without a meaningful alt is decorative and hidden from screen readers. */
const isDecorative = (alt?: string) => !alt?.trim()

/** Exposes a non-<img> element as an image to assistive technology, or hides it. */
const imageRoleProps = (alt?: string) =>
  isDecorative(alt)
    ? ({ "aria-hidden": "true" } as const)
    : ({ role: "img", "aria-label": alt } as const)

export function MenuImage(props: MenuImageProps): JSX.Element {
  const { src, svg, alt, className } = props
  const { hasIconColor } = usePopupContext()

  const recolor = Boolean(
    hasIconColor &&
      !props.excludeFromGlobalIconColor &&
      !props.preserveOriginalColor,
  )

  if (!isEmpty(src)) {
    return recolor ? (
      <MaskedImage src={src as string} alt={alt} className={className} />
    ) : (
      <img
        className={className}
        src={src}
        alt={alt ?? ""}
        {...(isDecorative(alt) ? { "aria-hidden": "true" } : {})}
      />
    )
  }

  if (!isEmpty(svg)) {
    return (
      <InlineSvg
        svg={svg as string}
        alt={alt}
        recolor={recolor}
        className={className}
      />
    )
  }

  return <></>
}

type MaskedImageProps = {
  src: string
  alt?: string
  className?: string
}

/**
 * Renders the icon as a mask so it is painted in the global icon color.
 * Sizing comes from className, like the plain <img> branch.
 */
function MaskedImage({ src, alt, className }: MaskedImageProps): JSX.Element {
  return (
    <span
      className={cn(css.itemImgMasked, className)}
      style={{ WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }}
      {...imageRoleProps(alt)}
    />
  )
}

type InlineSvgProps = {
  svg: string
  alt?: string
  recolor: boolean
  className?: string
}

function InlineSvg({
  svg,
  alt,
  recolor,
  className,
}: InlineSvgProps): JSX.Element {
  const [svgElm, setSvgElm] = useState<HTMLDivElement | null>(null)

  if (svgElm) {
    svgElm.innerHTML = svg
  }

  return (
    <div
      className={cn(css.menuImage, className)}
      style={{
        color: recolor ? "var(--sc-icon-color)" : "hsl(var(--foreground))",
      }}
      ref={setSvgElm}
      {...imageRoleProps(alt)}
    />
  )
}
