import React from 'react'
import {
  Dialog as DialogRoot,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'

import { t } from '@/services/i18n'

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
  const onOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose(false)
    }
  }
  return (
    <DialogRoot open={props.open} onOpenChange={onOpenChange}>
      <DialogContent className={css.dialog}>
        <DialogHeader>
          <DialogTitle className={css.title}>{props.title}</DialogTitle>
          <DialogDescription className={css.description}>
            {props.description()}
          </DialogDescription>
        </DialogHeader>
        {props.children}
        <DialogFooter>
          <button className={css.button} onClick={() => props.onClose(true)}>
            {props.okText}
          </button>
          <button
            className={css.buttonCancel}
            onClick={() => props.onClose(false)}
          >
            {t('labelCancel')}
          </button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
