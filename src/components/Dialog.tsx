import React, { Fragment } from 'react'
import { Dialog as HDialog, Transition } from '@headlessui/react'

import css from './Dialog.module.css'

type Props = {
  open: boolean
  onClose: (ret: boolean) => void
  title: string
  description: () => React.ReactNode
  okText: string
  children?: React.ReactNode
}

export function Dialog(props: Props) {
  return (
    <Transition
      show={props.open}
      enter={css.dialogTransition}
      enterFrom={css.dialogFrom}
      enterTo={css.dialogTo}
      leave={css.dialogTransition + ' duration-100'}
      leaveFrom={css.dialogTo}
      leaveTo={css.dialogFrom}
      as={Fragment}
    >
      <HDialog onClose={props.onClose} className={css.dialog}>
        <HDialog.Panel className={css.panel}>
          <HDialog.Title className={css.title}>{props.title}</HDialog.Title>
          <HDialog.Description className={css.description}>
            {props.description()}
          </HDialog.Description>
          {props.children}
          <div className={css.buttonContainer}>
            <button className={css.button} onClick={() => props.onClose(true)}>
              {props.okText}
            </button>
            <button
              className={css.buttonCancel}
              onClick={() => props.onClose(false)}
            >
              Cancel
            </button>
          </div>
        </HDialog.Panel>
      </HDialog>
    </Transition>
  )
}
