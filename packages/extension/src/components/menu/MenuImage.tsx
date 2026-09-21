import { isEmpty, isValidSVG, cn } from "@/lib/utils"
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

const toSvgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(
    Array.from(new TextEncoder().encode(svg), (byte) =>
      String.fromCharCode(byte),
    ).join(""),
  )}`

export function MenuImage(props: MenuImageProps): JSX.Element {
  const { src, svg, alt, className } = props
  const { hasIconColor } = usePopupContext()

  const recolor = Boolean(
    hasIconColor &&
    !props.excludeFromGlobalIconColor &&
    !props.preserveOriginalColor,
  )
  const imageSrc = !isEmpty(src)
    ? (src as string)
    : !isEmpty(svg) && isValidSVG(svg as string)
      ? toSvgDataUrl(svg as string)
      : undefined

  if (!isEmpty(imageSrc)) {
    return recolor ? (
      <MaskedImage src={imageSrc as string} alt={alt} className={className} />
    ) : (
      <img
        className={className}
        src={imageSrc}
        alt={alt ?? ""}
        {...(isDecorative(alt) ? { "aria-hidden": "true" } : {})}
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
 * Wraps a URL in a quoted CSS url() token. The URL comes from user-editable
 * command settings, so characters that would end the string early (quotes,
 * backslashes) or break it (newlines) are escaped.
 */
const toCssUrl = (src: string) =>
  `url("${src.replace(/[\\"]/g, "\\$&").replace(/\n/g, "\\a ")}")`

/**
 * Renders the icon as a mask so it is painted in the global icon color.
 * Sizing comes from className, like the plain <img> branch.
 */
function MaskedImage({ src, alt, className }: MaskedImageProps): JSX.Element {
  const maskImage = toCssUrl(src)
  return (
    <span
      className={cn(css.itemImgMasked, className)}
      style={{ WebkitMaskImage: maskImage, maskImage }}
      {...imageRoleProps(alt)}
    />
  )
}
