import { useState } from 'react'
import { sleep } from '@/lib/utils'
import { ExecState } from '@/const'
import css from '@/components/result/ResultPopup.module.css'
import { Icon } from '@/components/Icon'
import { Tooltip } from '@/components/Tooltip'

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
  const [buttonElm, setButtonElm] = useState<HTMLButtonElement | null>(null)
  const [status, setStatus] = useState(ExecState.NONE)
  const message = status === ExecState.SUCCESS ? 'Copied!' : 'Copy'
  const styleArr = Object.entries(styles).map(([key, value]) => ({
    key,
    value,
  }))

  const cssCopy = async () => {
    const copyText = styleArr
      .map((item) => `${toProp(item.key)}: ${item.value};`)
      .join('\n')
    navigator.clipboard.writeText(copyText)
    setStatus(ExecState.SUCCESS)
    await sleep(1000)
    setStatus(ExecState.NONE)
  }

  return (
    <div className={css.resultTableContainer}>
      <div className={css.resultTableCopy}>
        <button
          className={css.resultPopupButton}
          onClick={cssCopy}
          disabled={status === ExecState.SUCCESS}
          ref={setButtonElm}
        >
          {status === ExecState.NONE && <Icon name="copy" />}
          {status === ExecState.SUCCESS && (
            <Icon name="check" className={css.buttonSuccess} />
          )}
        </button>
        <Tooltip positionElm={buttonElm} text={message} />
      </div>
      <table className={css.resultTable}>
        <thead className={css.resultTableHeader}>
          <tr key="table-header">
            <th>Property</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody className={css.resultTableBody}>
          {styleArr.map((item) => {
            return (
              <tr key={item.key}>
                <td className={css.resultTableProperty}>{toName(item.key)}</td>
                <td className={css.resultTableValue}>{item.value}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
