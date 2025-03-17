import { useEffect, useState } from 'react'
import {
  ArrowDownFromLine,
  ArrowDownToLine,
  Ban,
  Check,
  CircleDashed,
  CircleAlert,
  Keyboard,
  LoaderCircle,
  MousePointerClick,
  Mouse,
  Type,
} from 'lucide-react'
import { usePageActionRunner } from '@/hooks/pageAction/usePageActionRunner'
import { RunningStatus } from '@/services/pageAction'
import { Ipc } from '@/services/ipc'
import type { PageActiontResult, PageActiontStatus } from '@/types'
import { PAGE_ACTION_EVENT, PAGE_ACTION_CONTROL, EXEC_STATE } from '@/const'
import { cn } from '@/lib/utils'

export function PageActionRunner(): JSX.Element {
  usePageActionRunner()
  const [tabId, setTabId] = useState<number | null>(null)
  const [results, setResults] = useState<PageActiontResult[]>([])
  const isRunning = results.length > 0

  const onStatusChange = (status: PageActiontStatus) => {
    if (status.tabId !== tabId) return
    setResults(status.results)
  }

  useEffect(() => {
    Ipc.getTabId().then(setTabId)
  }, [])

  useEffect(() => {
    RunningStatus.subscribe(onStatusChange)
    return () => {
      RunningStatus.unsubscribe(onStatusChange)
    }
  }, [tabId])

  if (!isRunning) return <></>
  return (
    <div className="fixed z-[2147483647] bottom-2 right-2 p-2 bg-gray-800/30 rounded-md pointer-events-none">
      <ul className="text-xs text-gray-50">
        {results.map((result) => (
          <li key={result.stepId} className="flex items-center gap-2 p-1">
            <StatusIcon status={result.status} />
            <TypeIcon type={result.type} className="" />
            <span className="font-mono max-w-48 truncate">{result.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const StatusIcon = ({
  status,
  className,
}: {
  status: EXEC_STATE
  className?: string
}) => {
  const size = 14
  switch (status) {
    case EXEC_STATE.Queue:
      return <CircleDashed size={size} className={cn(className)} />
    case EXEC_STATE.Start:
      return (
        <LoaderCircle size={size} className={cn('animate-spin', className)} />
      )
    case EXEC_STATE.Done:
      return <Check size={size} className={cn('stroke-sky-400', className)} />
    case EXEC_STATE.Failed:
      return (
        <CircleAlert size={size} className={cn('stroke-red-300', className)} />
      )
    case EXEC_STATE.Stop:
      return <Ban size={size} className={cn(className)} />
    default:
      return null
  }
}

const TypeIcon = ({
  type,
  className,
}: {
  type: PAGE_ACTION_EVENT | PAGE_ACTION_CONTROL
  className?: string
}) => {
  const size = 16
  switch (type) {
    case PAGE_ACTION_CONTROL.start:
      return <ArrowDownFromLine size={size} className={className} />
    case PAGE_ACTION_CONTROL.end:
      return <ArrowDownToLine size={size} className={className} />
    case PAGE_ACTION_EVENT.click:
      return <MousePointerClick size={size} className={className} />
    case PAGE_ACTION_EVENT.input:
      return <Type size={size} className={className} />
    case PAGE_ACTION_EVENT.scroll:
      return <Mouse size={size} className={className} />
    case PAGE_ACTION_EVENT.keyboard:
      return <Keyboard size={size} className={className} />
    default:
      return null
  }
}
