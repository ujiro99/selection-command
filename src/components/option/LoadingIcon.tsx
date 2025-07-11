import React, { forwardRef } from "react"
import styles from "./LoadingIcon.module.css"

type LoadingIconProp = {
  children?: React.ReactNode
}

export const LoadingIcon = forwardRef<HTMLDivElement, LoadingIconProp>(
  (props: LoadingIconProp, ref) => {
    return (
      <div className={styles.LoadingIcon} ref={ref}>
        <div className={styles.icon} />
        <div className={styles.children}>{props.children}</div>
      </div>
    )
  },
)
