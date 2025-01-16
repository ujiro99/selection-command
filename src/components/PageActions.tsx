import { useEffect, useState } from 'react'
import { Ipc, TabCommand } from '@/services/ipc'
import type { IpcCallback } from '@/services/ipc'
import { UserBehaviour } from '@/services/userBehaviour'
import { PageAction, PageActionParam } from '@/types'

export function PageActions(): JSX.Element {
  const [actions, setActions] = useState<PageAction[]>([])

  useEffect(() => {
    console.log('PageActions', '1')

    UserBehaviour.start()
    setTimeout(() => {
      UserBehaviour.stop()
    }, 100000)

    const addActions = (param: PageActionParam) => {
      console.log('addActions', param)
      setActions(param.actions)
      return false
    }

    Ipc.addListener(TabCommand.notifyPageAction, addActions as IpcCallback)
    return () => {
      Ipc.removeListener(TabCommand.notifyPageAction)
    }
  }, [])

  return (
    <div className="fixed z-10 bottom-0 p-2">
      <div>
        <button
          className="bg-stone-300 rounded-lg p-2"
          onClick={() => UserBehaviour.reset()}
        >
          Reset
        </button>
      </div>
    <div>
        <ol className="flex gap-2 p-4">
        {actions.map((action) => (
            <li className="bg-red-400 rounded-lg p-2" key={action.timestamp}>
            {action.type}
          </li>
        ))}
      </ol>
    </div>
    </div>
  )
}
