import { useEffect, useState } from 'react'
import {
  LoaderCircle,
  Check,
  Ban,
  ArrowDownFromLine,
  MousePointerClick,
  Type,
  Mouse,
  Keyboard,
  ArrowDownToLine,
} from 'lucide-react'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import {
  usePageActionRunner,
  RunnerEvent,
} from '@/hooks/pageAction/usePageActionRunner'
import { Ipc, TabCommand } from '@/services/ipc'
import type { RunPageActionProps, Message } from '@/services/ipc'
import { PAGE_ACTION_EVENT, PAGE_ACTION_CONTROL } from '@/const'
import { cn } from '@/lib/utils'

const COMMANDS = [TabCommand.runPageAction]

type Result = {
  status: RunnerEvent
  stepId: string
  type: PAGE_ACTION_EVENT | PAGE_ACTION_CONTROL
  label: string
}

export function PageActionRunner(): JSX.Element {
  const [tabId, setTabId] = useState<number | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const Runner = usePageActionRunner()
  const { setContextData } = usePageActionContext()

  const appendResult = (result: Result) => {
    setResults((list) => {
      const index = list.findIndex((r) => r.stepId === result.stepId)
      if (index !== -1) {
        console.warn('Duplicated result', result)
        debugger
        return list
      }
      return [...list, result]
    })
  }

  const updateResult = (result: Result) => {
    setResults((list) => {
      const index = list.findIndex((r) => r.stepId === result.stepId)
      if (index === -1) return list
      list[index] = result
      return [...list]
    })
  }

  const onStart = (e: any) => {
    const result = {
      status: RunnerEvent.Start,
      stepId: e.detail.id,
      type: e.detail.type,
      label: e.detail.param.label,
    }
    appendResult(result)
  }

  const onDone = (e: any) => {
    const result = {
      status: RunnerEvent.Done,
      stepId: e.detail.id,
      type: e.detail.type,
      label: e.detail.param.label,
    }
    updateResult(result)
  }

  const onFailed = (e: any) => {
    const result = {
      status: RunnerEvent.Failed,
      stepId: e.detail.id,
      type: e.detail.type,
      label: e.detail.param.label,
    }
    updateResult(result)
  }

  const execute = async (message: Message | null) => {
    if (!message) return
    const props = message.param as RunPageActionProps
    console.log('runPageAction', props)
    // Set context of PageAction
    await setContextData({
      runnerId: Runner.id,
      srcUrl: props.srcUrl,
      selectedText: props.selectedText,
      clipboardText: props.clipboardText,
    })
    await Runner.run(props.steps)
  }

  useEffect(() => {
    Ipc.getTabId().then(setTabId)
  }, [])

  useEffect(() => {
    const start = async () => {
      if (tabId == null) return
      let msg
      do {
        msg = await Ipc.recvQueue(tabId, COMMANDS)
        msg && (await execute(msg))
      } while (msg)

      Ipc.addQueueChangedListener(tabId, COMMANDS, execute)
      return () => {
        Ipc.removeQueueChangedLisner(tabId, COMMANDS)
      }
    }
    start()
  }, [tabId])

  useEffect(() => {
    Runner.subscribe(RunnerEvent.Start, onStart)
    Runner.subscribe(RunnerEvent.Done, onDone)
    Runner.subscribe(RunnerEvent.Failed, onFailed)
    return () => {
      Runner.unsubscribe(RunnerEvent.Start, onStart)
      Runner.unsubscribe(RunnerEvent.Done, onDone)
      Runner.unsubscribe(RunnerEvent.Failed, onFailed)
    }
  }, [])

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
  status: RunnerEvent
  className?: string
}) => {
  const size = 14
  switch (status) {
    case RunnerEvent.Start:
      return (
        <LoaderCircle size={size} className={cn('animate-spin', className)} />
      )
    case RunnerEvent.Done:
      return <Check size={size} className={cn('stroke-sky-400', className)} />
    case RunnerEvent.Failed:
      return <Ban size={size} className={cn('stroke-red-300', className)} />
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
