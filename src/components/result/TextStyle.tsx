import React from 'react'
import classNames from 'classnames'

import {
  resultPopupButton,
  resultTable,
  resultTableContainer,
  resultTableHeader,
  resultTableBody,
  resultTableProperty,
  resultTableValue,
  resultTableCopy,
} from '@/components/result/ResultPopup.module.css'
import { Icon } from '@/components/Icon'

const toName = (str: string) => {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}

const toProp = (str: string) => {
  return str.replace(/([A-Z])/g, '-$1').replace(/^./, (s) => s.toLowerCase())
}

type Props = {
  styles: FontCSS
}

export function TextStyle({ styles }: Props) {
  const styleArr = Object.entries(styles).map(([key, value]) => ({
    key,
    value,
  }))

  const cssCopy = () => {
    const copyText = styleArr
      .map((item) => `${toProp(item.key)}: ${item.value};`)
      .join('\n')
    navigator.clipboard.writeText(copyText)
  }

  return (
    <div className={resultTableContainer}>
      <button
        className={classNames(resultTableCopy, resultPopupButton)}
        onClick={cssCopy}
      >
        <Icon name="copy" />
      </button>
      <table className={resultTable}>
        <thead className={resultTableHeader}>
          <tr key="table-header">
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody className={resultTableBody}>
          {styleArr.map((item) => {
            return (
              <tr key={item.key}>
                <td className={resultTableProperty}>{toName(item.key)}</td>
                <td className={resultTableValue}>{item.value}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
