import React, { useRef } from 'react'
import classNames from 'classnames'
import { Icon } from '../Icon'
import {
  item,
  button,
  moreButton,
  moreIcon,
  moreButtonHorizontal,
  itemTitle,
  itemOnlyIcon,
} from '../Menu.module.css'
import { Ipc, BgCommand } from '../../services/ipc'
import { t } from '../../services/i18n'
import { Tooltip } from '../Tooltip'

type Props = {
  onlyIcon: boolean
}

export function OptionButton(props: Props): JSX.Element {
  const elmRef = useRef(null)
  const onlyIcon = props.onlyIcon
  const title = t('labelOption')

  const openOption = () => {
    Ipc.send(BgCommand.openOption)
  }

  return (
    <>
      <button
        className={classNames(item, button, moreButton, {
          [itemOnlyIcon]: onlyIcon,
          [moreButtonHorizontal]: onlyIcon,
        })}
        onClick={openOption}
        ref={elmRef}
      >
        <Icon name="more-vert" className={moreIcon} />
        <span className={itemTitle}>{title}</span>
      </button>
      {onlyIcon && <Tooltip positionRef={elmRef}>{title}</Tooltip>}
    </>
  )
}
