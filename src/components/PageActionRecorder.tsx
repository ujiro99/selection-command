import { useEffect, useState } from 'react'
import {
  usePageActionRunner,
  RunnerEvent,
} from '@/hooks/pageAction/usePageActionRunner'
import { PageActionListener as Listener } from '@/services/pageAction'
import { PageActionType } from '@/types'
import {
  Storage,
  SESSION_STORAGE_KEY,
  ChangedCallback,
} from '@/services/storage'
import { cn, capitalizeFirst } from '@/lib/utils'
import { PAGE_ACTION_MAX } from '@/const'

export function PageActionRecorder(): JSX.Element {
  const Runner = usePageActionRunner()
  const { isRunning } = Runner
  const [actions, setActions] = useState<PageActionType[]>([])
  const [isRecording, setIsRecording] = useState(true)
  const [currentId, setCurrentId] = useState<string>()
  const [failedId, setFailedId] = useState<string>()
  const remain = PAGE_ACTION_MAX - actions.length

  const clearState = () => {
    setCurrentId('')
    setFailedId('')
  }

  const reset = () => {
    clearState()
    Listener.reset()
  }

  const preview = () => {
    clearState()
    Listener.stop()
    Runner.start()
  }

  const pause = () => {
    setIsRecording(false)
    Listener.stop()
  }

  const resume = () => {
    setIsRecording(true)
    Listener.start()
  }

  const onStart = (e: any) => {
    setCurrentId(e.detail.id)
  }

  const onFailed = (e: any) => {
    setFailedId(e.detail.id)
    Runner.stop()
  }

  useEffect(() => {
    const addActions = (param: PageActionType[]) => {
      setActions(param ?? [])
    }

    const init = async () => {
      const actions = await Storage.get<PageActionType[]>(
        SESSION_STORAGE_KEY.PAGE_ACTION,
      )
      addActions(actions)
    }
    init()

    Storage.addListener(
      SESSION_STORAGE_KEY.PAGE_ACTION,
      addActions as ChangedCallback,
    )
    Runner.subscribe(RunnerEvent.Start, onStart)
    Runner.subscribe(RunnerEvent.Failed, onFailed)

    return () => {
      Storage.removeListener(
        SESSION_STORAGE_KEY.PAGE_ACTION,
        addActions as ChangedCallback,
      )
      Runner.unsubscribe(RunnerEvent.Start, onStart)
      Runner.unsubscribe(RunnerEvent.Failed, onFailed)
    }
  }, [])

  useEffect(() => {
    if (isRunning) {
      pause()
    } else {
      resume()
    }
    return () => {
      Listener.stop()
    }
  }, [isRunning])

  return (
    <div className="fixed z-[2147483647] inset-x-0 bottom-0 p-4 pointer-events-none">
      <div className="inline-block relative left-[50%] translate-x-[-50%]">
        <div className="flex gap-2">
          {isRecording ? (
            <button
              className="bg-stone-300 rounded-lg p-2 pointer-events-auto"
              onClick={() => pause()}
            >
              Pause
            </button>
          ) : (
            <button
              className="bg-stone-300 rounded-lg p-2 pointer-events-auto"
              onClick={() => resume()}
            >
              Resume
            </button>
          )}
          {isRunning ? (
            <button
              className="bg-stone-300 rounded-lg p-2 pointer-events-auto"
              onClick={() => Runner.stop()}
            >
              Stop
            </button>
          ) : (
            <button
              className="bg-stone-300 rounded-lg p-2 pointer-events-auto"
              onClick={() => preview()}
            >
              Preview
            </button>
          )}
        </div>
        <ol className="flex flex-wrap w-[500px] gap-2 mt-2">
          {actions.map((action) => (
            <li
              className={cn(
                'bg-blue-200 rounded-xl p-1.5 text-center',
                currentId === action.id ? 'bg-green-200' : '',
                failedId === action.id ? 'bg-red-200' : '',
              )}
              key={action.timestamp}
            >
              <p className="text-sm text-stone-600 font-medium">
                {capitalizeFirst(action.type)}
              </p>
              <p className="truncate w-20 text-xs text-stone-600">{`${action.params.label}`}</p>
            </li>
          ))}
          {remain > 0 && (
            <li className="bg-stone-200 rounded-lg p-2" key="remaining">
              {`残り${remain} Step`}
            </li>
          )}
        </ol>
      </div>
      <div className="flex gap-2 p-2">
        <button
          className="bg-stone-300 rounded-lg p-2 pointer-events-auto"
          onClick={() => reset()}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
