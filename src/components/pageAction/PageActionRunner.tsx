import { useEffect, useState, useRef } from 'react'
import {
  Ban,
  Check,
  CircleDashed,
  CircleAlert,
  LoaderCircle,
  X,
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
  const [visible, setVisible] = useState(false)
  const toRef = useRef<number>()

  const hasError = (results: PageActiontResult[]): boolean => {
    return results.some((r) => r.status === EXEC_STATE.Failed)
  }

  const onStatusChange = (status: PageActiontStatus) => {
    if (status.tabId !== tabId) return
    setVisible(true)
    setResults(status.results)
    clearTimeout(toRef.current)
    if (hasError(status.results)) return
    toRef.current = window.setTimeout(() => {
      setVisible(false)
    }, 5000)
  }

  useEffect(() => {
    const init = async () => {
      const tid = await Ipc.getTabId()
      setTabId(tid)
      const status = await RunningStatus.get()
      if (status.tabId === tid) {
        setVisible(true)
        setResults(status.results)
      }
    }
    init()
  }, [])

  useEffect(() => {
    RunningStatus.subscribe(onStatusChange)
    return () => {
      RunningStatus.unsubscribe(onStatusChange)
    }
  }, [tabId])

  return (
    <div
      className={cn(
        'relative fixed z-[2147483647] top-2 right-2 pointer-events-none',
        'backdrop-blur-md bg-gray-200/40 rounded-md p-3 shadow-md transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {hasError(results) && (
        <button
          className="absolute right-1 top-1 pointer-events-auto bg-gray-50 rounded-full p-1"
          onClick={() => setVisible(false)}
        >
          <X size={12} className="stroke-gray-500" />
        </button>
      )}
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
