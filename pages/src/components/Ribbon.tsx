import clsx from 'clsx'

type Props = {
  className?: string
  children: React.ReactNode
}

import css from './Ribbon.module.css'

export function Ribbon(props: Props): JSX.Element {
  return (
    <div className={clsx(css.ribbon, props.className)}>{props.children}</div>
  )
}
