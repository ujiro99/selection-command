import {
  ReactNode,
  useState,
  createContext,
  useContext,
  useEffect,
} from 'react'
import { Command } from '@/types'
import { sortUrlsByDomain } from '@/lib/utils'
import { SORT_ORDER } from '@/const'

export enum Direction {
  asc = 'asc',
  desc = 'desc',
}

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
  [SORT_ORDER.searchUrl]: sortSearchUrl,
  [SORT_ORDER.title]: sortTitle,
  [SORT_ORDER.download]: sortDownload,
  [SORT_ORDER.star]: sortStar,
  [SORT_ORDER.addedAt]: sortAddedAt,
}

export enum SortType {
  text = 'text',
  number = 'number',
  date = 'date',
}

const SortTypeMap = {
  [SORT_ORDER.searchUrl]: SortType.text,
  [SORT_ORDER.title]: SortType.text,
  [SORT_ORDER.download]: SortType.number,
  [SORT_ORDER.star]: SortType.number,
  [SORT_ORDER.addedAt]: SortType.date,
}

type OptionType = {
  order: SORT_ORDER | undefined
  direction: Direction | undefined
}

type ContextType = OptionType & {
  setOption: (option: OptionType) => void
}

const CommandSorterContext = createContext<ContextType>({
  order: SORT_ORDER.searchUrl,
  direction: Direction.asc,
  setOption: () => {},
})

const STORAGE_KEY = 'SortOrder'

export const CommandSorterProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [order, setOrder] = useState<SORT_ORDER>()
  const [direction, setDirection] = useState<Direction>()

  const setOption = (option: OptionType) => {
    setOrder(option.order)
    setDirection(option.direction)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(option))
  }

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      setOption(JSON.parse(data))
    } else {
      setOption({
        order: SORT_ORDER.searchUrl,
        direction: Direction.asc,
      })
    }
  }, [])

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
  let sort

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
