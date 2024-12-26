import { ArrowDown01, ArrowUp10, ArrowUpAZ, ArrowDownZA } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from './ui/skeleton'
import {
  Order,
  Labels,
  Direction,
  SortType,
  useCommandSorter,
} from '@/hooks/useCommandSorter'
import { cn } from '@/lib/utils'

export function SortOrder(): JSX.Element {
  const { option, setOption, type } = useCommandSorter()
  const { order, direction } = option
  const loaded = order && direction

  const onChangeOrder = (o: Order) => {
    setOption({
      order: o,
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
    <div className="w-full flex gap-1 justify-end">
      <Select onValueChange={onChangeOrder} value={order}>
        <SelectTrigger
          className={cn(
            'text-sm lg:text-sm w-36 h-8 rounded-lg transition duration-50',
            !loaded && 'opacity-0',
          )}
        >
          <SelectValue placeholder="Sort Order" />
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
        className={cn(
          'px-1.5 py-1 border border-input shadow-sm bg-white rounded-lg hover:bg-accent transition duration-50 leading-none',
          !loaded && 'opacity-0',
        )}
      >
        {type && direction ? (
          <Arrow type={type} direction={direction} />
        ) : (
          <Skeleton className="h-5 w-[18px]" />
        )}
      </button>
    </div>
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
          {direction === Direction.asc ? '新' : '古'}
        </span>
      )
  }
}
