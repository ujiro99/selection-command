import React from 'react'
import css from './Option.module.css'
import css2 from './HubBanner.module.css'
import { t } from '@/services/i18n'

export function HubBanner() {
  return (
    <div className={css.menu}>
      <p className={css2.menuLabel}>
        <span>Sharing Commands</span>
      </p>
      <a href="https://ujiro99.github.io/selection-command/">
        <img
          className={css2.banner}
          src="/SelectionCommandHub.png"
          alt="Selection Command"
          width="220"
        />
      </a>
      <p className={css2.description}>{t('commandHub_description')}</p>
    </div>
  )
}
