import { useEffect, useState } from 'react'
import { usePageActionRunner } from '@/hooks/pageAction/usePageActionRunner'
import { UserBehaviour } from '@/services/userBehaviour'
import { PageActionType } from '@/types'
import {
  Storage,
  SESSION_STORAGE_KEY,
  ChangedCallback,
} from '@/services/storage'
import { cn } from '@/lib/utils'

export function PageActionRecorder(): JSX.Element {
  const { isRunning, start, stop, event } = usePageActionRunner()
  const [actions, setActions] = useState<PageActionType[]>([])
  const [currentId, setCurrentId] = useState<string>()

  const reset = () => {
    UserBehaviour.reset()
  }

  const preview = () => {
    UserBehaviour.stop()
    const url = 'http://localhost:3000/'
    location.replace(url)
    start()
  }

  const onExecuted = (id: string) => {
    setCurrentId(id)
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
    event.addOnExecutedListener(onExecuted)

    return () => {
      Storage.removeListener(
        SESSION_STORAGE_KEY.PAGE_ACTION,
        addActions as ChangedCallback,
      )
      event.removeOnExecutedListener(onExecuted)
    }
  }, [])

  useEffect(() => {
    if (isRunning) {
      UserBehaviour.stop()
    } else {
      setCurrentId('')
      UserBehaviour.start()
    }
    return () => {
      UserBehaviour.stop()
    }
  }, [isRunning])

  return (
    <div className="fixed z-10 bottom-0 p-2">
      <div>
        <button className="bg-stone-300 rounded-lg p-2" onClick={() => reset()}>
          Reset
        </button>
        {isRunning ? (
          <button
            className="bg-stone-300 rounded-lg p-2"
            onClick={() => stop()}
          >
            Stop
          </button>
        ) : (
          <button
            className="bg-stone-300 rounded-lg p-2"
            onClick={() => preview()}
          >
            Preview
          </button>
        )}
      </div>
      <div>
        <ol className="flex gap-2 p-4">
          {actions.map((action) => (
            <li
              className={cn(
                'bg-blue-200 rounded-lg p-2',
                currentId === action.id ? 'bg-green-200' : '',
              )}
              key={action.timestamp}
            >
              {action.type}
            </li>
          ))}
          <li className="bg-stone-200 rounded-lg p-2" key="remaining">
            残り10Step
          </li>
        </ol>
      </div>
    </div>
  )
}
