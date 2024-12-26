import { ArrowDown01, ArrowUp10, ArrowUpAZ, ArrowDownZA } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Order,
  Labels,
  Direction,
  CommandSorterProvider,
  SortType,
  useCommandSorter,
} from '@/hooks/useCommandSorter'

export function SortOrder(): JSX.Element {
  const { option, setOption, type } = useCommandSorter()
  const { order, direction } = option

  const onChangeOrder = (_order: Order) => {
    setOption({
      order: _order,
      direction,
    })
  }

  const onClickDirection = () => {
    setOption({
      order,
      direction: direction === Direction.asc ? Direction.desc : Direction.asc,
    })
  }

  return (
    <CommandSorterProvider>
      <div className="w-full flex gap-1 justify-end">
        <Select onValueChange={onChangeOrder} defaultValue={option.order}>
          <SelectTrigger className="text-sm lg:text-sm w-36 h-8 rounded-lg">
            <SelectValue placeholder="Select a openMode" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(Labels).map(([key, label]) => (
                <SelectItem value={key} key={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <button
          onClick={onClickDirection}
          className="px-1.5 py-1 border border-input shadow-sm bg-white rounded-lg hover:bg-accent transition leading-none"
        >
          <Arrow type={type} direction={direction} />
        </button>
      </div>
    </CommandSorterProvider>
  )
}

export function Arrow({
  type,
  direction,
}: {
  type: SortType
  direction: Direction
}): JSX.Element {
  switch (type) {
    case SortType.text:
      return direction === Direction.asc ? (
        <ArrowUpAZ size={18} className="stroke-stone-500" />
      ) : (
        <ArrowDownZA size={18} className="stroke-stone-500" />
      )
    case SortType.number:
      return direction === Direction.asc ? (
        <ArrowUp10 size={18} className="stroke-stone-500" />
      ) : (
        <ArrowDown01 size={18} className="stroke-stone-500" />
      )
    case SortType.date:
      return (
        <span className="text-sm px-[2px]">
          {direction === Direction.asc ? '新' : '旧'}
        </span>
      )
  }
}
