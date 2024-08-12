import React from 'react'
import { container, item, button, label } from './TableOfContents.module.css'

type Prop = {
  properties: string[]
  labels: { [key: string]: string }
}

export const TableOfContents = ({ properties, labels }: Prop) => {
  const jump = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const target = e.currentTarget.dataset.target
    const menu = document.querySelector(`#root_${target}`)
    menu?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <ul className={container}>
      <span className={label}>Menu</span>
      {properties.map((p) => (
        <li className={item} key={p}>
          <button className={button} onClick={jump} data-target={p}>
            <span>{labels[p]}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
