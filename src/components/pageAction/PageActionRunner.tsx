import { useEffect, useState, useRef } from 'react'
import {
  Ban,
  Check,
  CircleDashed,
  CircleAlert,
  LoaderCircle,
} from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import { TypeIcon } from '@/components/pageAction/TypeIcon'
import { usePageActionRunner } from '@/hooks/pageAction/usePageActionRunner'
import { RunningStatus } from '@/services/pageAction'
import { Ipc } from '@/services/ipc'
import type { PageActiontResult, PageActiontStatus } from '@/types'
import { EXEC_STATE } from '@/const'
import { cn, isEmpty } from '@/lib/utils'

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
    <div
      className={cn(
        'fixed z-[2147483647] top-2 right-2 pointer-events-none',
        'backdrop-blur-md bg-gray-200/40 rounded-md p-3 shadow-md',
      )}
    >
      <ul className="text-xs text-gray-600">
        {results.map((result) => (
          <Step key={result.stepId} result={result} />
        ))}
      </ul>
    </div>
  )
}

const Step = ({ result }: { result: PageActiontResult }) => {
  const stepRef = useRef<HTMLLIElement>(null)
  const hasMessage = !isEmpty(result.message)
  return (
    <li
      ref={stepRef}
      className={cn(
        'flex items-center gap-1.5 p-1',
        hasMessage && 'cursor-help pointer-events-auto text-red-500',
      )}
    >
      <StatusIcon status={result.status} />
      <TypeIcon
        type={result.type}
        className={cn(hasMessage ? 'stroke-red-500' : 'stroke-gray-500')}
      />
      <span className="font-mono max-w-40 truncate">{result.label}</span>
      {hasMessage && (
        <Tooltip positionElm={stepRef.current} text={result.message ?? ''} />
      )}
    </li>
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
      return <Check size={size} className={cn(className)} />
    case EXEC_STATE.Failed:
      return (
        <CircleAlert size={size} className={cn('stroke-red-500', className)} />
      )
    case EXEC_STATE.Stop:
      return <Ban size={size} className={cn(className)} />
    default:
      return null
  }
}
