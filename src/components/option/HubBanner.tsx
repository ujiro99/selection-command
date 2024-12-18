import React from 'react'
import css from './Option.module.css'
import css2 from './HubBanner.module.css'
import { t } from '@/services/i18n'
import { cn } from '@/lib/utils'

export function HubBanner() {
  return (
    <div className={css.menu}>
      <p className={css2.menuLabel}>
        <span>Sharing Commands</span>
      </p>
      <a
        href="https://ujiro99.github.io/selection-command/?utm_source=optionPage&utm_medium=banner"
        target="_blank"
      >
        <img
          className={cn(css2.banner, 'shadow-xl rounded-md px-2 pt-2 pb-1')}
          src="/SelectionCommandHub.png"
          alt="Selection Command"
          width="230"
        />
      </a>
      <p className={cn(css2.description, 'mt-6')}>
        {t('commandHub_description')}
      </p>
    </div>
  )
}
