import { ReactNode, useState, createContext, useContext } from 'react'
import { Command } from '@/types'
import { sortUrlsByDomain } from '@/lib/utils'

export enum Order {
  searchUrl = 'searchUrl',
  title = 'title',
  download = 'download',
  star = 'star',
  addedAt = 'addedAt',
}

export enum Direction {
  asc = 'asc',
  desc = 'desc',
}

export const Labels = {
  [Order.searchUrl]: '検索URL',
  [Order.title]: 'タイトル',
  [Order.download]: 'ダウンロード数',
  [Order.star]: 'スター数',
  [Order.addedAt]: '登録日',
} as Record<Order, string>

const getLocale = () => navigator?.language ?? 'en'
const sortSearchUrl = (cmds: Command[]) => sortUrlsByDomain(cmds, 'searchUrl')
const sortTitle = (cmds: Command[]) =>
  cmds.sort((a, b) => a.title.localeCompare(b.title, getLocale()))
const sortDownload = (cmds: Command[]) =>
  cmds.sort((a, b) => a.download - b.download)
const sortStar = (cmds: Command[]) => cmds.sort((a, b) => a.star - b.star)
const sortAddedAt = (cmds: Command[]) =>
  cmds.sort((a, b) => a.addedAt.localeCompare(b.addedAt, getLocale()))

const sortFunctions = {
  [Order.searchUrl]: sortSearchUrl,
  [Order.title]: sortTitle,
  [Order.download]: sortDownload,
  [Order.star]: sortStar,
  [Order.addedAt]: sortAddedAt,
}

export enum SortType {
  text = 'text',
  number = 'number',
  date = 'date',
}

const SortTypeMap = {
  [Order.searchUrl]: SortType.text,
  [Order.title]: SortType.text,
  [Order.download]: SortType.number,
  [Order.star]: SortType.number,
  [Order.addedAt]: SortType.date,
}

type OptionType = {
  order: Order | undefined
  direction: Direction | undefined
}

type ContextType = OptionType & {
  setOption: (option: OptionType) => void
}

const CommandSorterContext = createContext<ContextType>({
  order: Order.searchUrl,
  direction: Direction.asc,
  setOption: () => {},
})

export const CommandSorterProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [order, setOrder] = useState<Order>()
  const [direction, setDirection] = useState<Direction>()

  const setOption = (option: OptionType) => {
    setOrder(option.order)
    setDirection(option.direction)
  }

  const option = {
    order,
    direction,
    setOption,
  }

  return (
    <CommandSorterContext.Provider value={option}>
      {children}
    </CommandSorterContext.Provider>
  )
}

export function useCommandSorter() {
  const { order, direction, setOption } = useContext(CommandSorterContext)

  let type
  let sort = sortSearchUrl

  if (order) {
    type = SortTypeMap[order]
    sort = sortFunctions[order]
    let needReverse = direction === Direction.desc
    if (type === SortType.date || type === SortType.number) {
      needReverse = !needReverse
    }

    if (needReverse) {
      sort = (commands: Command[]) => sortFunctions[order](commands).reverse()
    }
  }

  return {
    option: {
      order,
      direction,
    },
    setOption,
    sort,
    type,
  }
}
