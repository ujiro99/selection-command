import React from 'react'
import { MenuItem } from './MenuItem'
import { menu, list } from './Menu.module.css'

type MenuProps = {
  selectionText: string
}

export function Menu(props: MenuProps): JSX.Element {
  const menuObj = [
    {
      id: 1,
      title: 'Google',
      searchUrl: 'https://google.com/search?q=%s',
      iconUrl:
        'https://static-00.iconduck.com/assets.00/google-icon-2048x2048-czn3g8x8.png',
      openInPopup: false,
    },
    {
      id: 2,
      title: 'Google Image',
      searchUrl: 'https://google.com/search?q=%s&tbm=isch',
      iconUrl:
        'https://static-00.iconduck.com/assets.00/google-icon-2048x2048-czn3g8x8.png',
      openInPopup: false,
    },
    {
      id: 3,
      title: '英辞郎',
      searchUrl: 'https://eow.alc.co.jp/search?q=%s',
      iconUrl: 'https://valkyrie.tokyo/wp-content/uploads/2017/08/eijiro.png',
      openInPopup: true,
    },
    {
      id: 4,
      title: 'sample',
      searchUrl: 'https://v8.dev/features/import-assertions',
      iconUrl: 'https://valkyrie.tokyo/wp-content/uploads/2017/08/eijiro.png',
      openInPopup: true,
    },
  ]

  function toUrl(searchUrl: string, text: string): string {
    return searchUrl.replace('%s', text)
  }

  return (
    <div className={menu}>
      <ul className={list}>
        {menuObj.map((obj) => {
          return (
            <li key={'menu_' + obj.id}>
              <MenuItem
                title={obj.title}
                url={toUrl(obj.searchUrl, props.selectionText)}
                iconUrl={obj.iconUrl}
                openInPopup={obj.openInPopup}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
