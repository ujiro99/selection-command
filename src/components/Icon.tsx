import React from "react"

type Props = {
  name: string
  className?: string
  style?: React.CSSProperties
}

export function Icon(props: Props): JSX.Element {
  const href = `#icon-${props.name}`

  const className = props.className ?? "h-full w-full"

  return (
    <svg className={className} style={props.style}>
      <use xlinkHref={href} />
    </svg>
  )
}
