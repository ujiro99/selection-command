import * as React from 'react'
import NextImage from 'next/image'

import nextConfig from '../../next.config.mjs'
const BASE_PATH = nextConfig.basePath || ''

type Props = {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
}

function Image(props: Props): JSX.Element {
  let { src } = props
  if (src.startsWith('/')) {
    src = `${BASE_PATH}/${props.src}`
    return (
      <NextImage
        className="dark:invert"
        src={src}
        alt={`${props.alt}`}
        width={`${props.width ?? 20}`}
        height={`${props.height ?? 20}`}
        style={props.style}
      />
    )
  }
  return (
    <img
      className={props.className}
      src={src}
      alt={props.alt}
      width={props.width}
      height={props.height}
      style={props.style}
    />
  )
}

export { Image }
