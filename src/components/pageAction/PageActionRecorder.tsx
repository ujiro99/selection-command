import { useEffect, useState } from 'react'
import {
  usePageActionRunner,
  RunnerEvent,
} from '@/hooks/pageAction/usePageActionRunner'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import { PageActionItem } from '@/components/pageAction/PageActionItem'
import { InputPopup } from '@/components/pageAction/InputPopup'
import { InputEditor } from '@/components/pageAction/InputEditor'
import { PageActionListener as Listener } from '@/services/pageAction'
import {
  Storage,
  SESSION_STORAGE_KEY as STORAGE_KEY,
  ChangedCallback,
} from '@/services/storage'
import { Ipc, BgCommand } from '@/services/ipc'
import { getSelectionText } from '@/services/dom'
import { PAGE_ACTION_MAX } from '@/const'
import type { PageActionType } from '@/types'
import { isEmpty } from '@/lib/utils'

const isControlType = (type: string): boolean => {
  return ['start', 'end'].includes(type)
}

export function PageActionRecorder(): JSX.Element {
  const Runner = usePageActionRunner()
  const { isRunning } = Runner
  const { setContextData } = usePageActionContext()
  const [actions, setActions] = useState<PageActionType[]>([])
  const [isRecording, setIsRecording] = useState(true)
  const [currentId, setCurrentId] = useState<string>()
  const [failedId, setFailedId] = useState<string>()
  const [failedMessage, setFailedMesage] = useState<string>('')
  const [previewElm, setPreviewElm] = useState<HTMLButtonElement | null>()
  const [editId, setEditId] = useState<string | null>(null)
  const editorValue = actions.find((a) => a.id === editId)?.params
    .value as string
  const editorOpen = !isEmpty(editId)

  const remain = PAGE_ACTION_MAX - actions.length

  const clearState = () => {
    setCurrentId('')
    setFailedId('')
    setFailedMesage('')
  }

  const reset = () => {
    clearState()
    Ipc.send(BgCommand.resetPageAction)
  }

  const preview = () => {
    setTimeout(async () => {
      // Wait for the clipboard to be updated.
      const text = await navigator.clipboard.readText()
      await setContextData({
        selectedText: getSelectionText(),
        clipboardText: text,
      })
      Runner.start()
    }, 100)
    clearState()
    Listener.stop()
  }

  const pause = () => {
    setIsRecording(false)
    Listener.stop()
  }

  const resume = () => {
    setIsRecording(true)
    Listener.start()
  }

  const edit = (id: string) => {
    setEditId(id)
  }

  const editorSubmit = (value: string) => {
    Ipc.send(BgCommand.updatePageAction, { id: editId, value })
    setEditId(null)
  }

  const removeAction = (id: string) => {
    Ipc.send(BgCommand.removePageAction, { id })
  }

  const onStart = (e: any) => {
    setCurrentId(e.detail.id)
  }

  const onFailed = (e: any) => {
    setFailedId(e.detail.id)
    setFailedMesage(e.detail.message)
    Runner.stop()
  }

  useEffect(() => {
    const addList = (list: PageActionType[]) => {
      setActions((list ?? []).filter((l) => !isControlType(l.type)))
    }

    const init = async () => {
      const actions = await Storage.get<PageActionType[]>(
        STORAGE_KEY.PAGE_ACTION,
      )
      addList(actions)
    }
    init()

    Storage.addListener(STORAGE_KEY.PAGE_ACTION, addList as ChangedCallback)
    Runner.subscribe(RunnerEvent.Start, onStart)
    Runner.subscribe(RunnerEvent.Failed, onFailed)

    return () => {
      Storage.removeListener(
        STORAGE_KEY.PAGE_ACTION,
        addList as ChangedCallback,
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

  useEffect(() => {
    if (previewElm) {
      previewElm.addEventListener('click', preview)
    }
    return () => {
      previewElm?.removeEventListener('click', preview)
    }
  }, [previewElm])

  return (
    <div className="fixed z-[2147483647] inset-x-0 bottom-0 p-4 pointer-events-none">
      {!editorOpen && <InputPopup />}
      <InputEditor
        open={editorOpen}
        onOpenChange={(o) => !o && setEditId(null)}
        value={editorValue}
        onSubmit={editorSubmit}
      />
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
              ref={setPreviewElm}
            >
              Preview
            </button>
          )}
          <button
            className="bg-stone-300 rounded-lg p-2 pointer-events-auto"
            onClick={() => reset()}
          >
            Reset
          </button>
        </div>
        <ol className="flex flex-wrap w-[500px] gap-2 mt-2">
          {actions.map((action) => (
            <PageActionItem
              action={action}
              currentId={currentId}
              failedId={failedId}
              failedMessage={failedMessage}
              key={action.id}
              onDelete={removeAction}
              onClickEdit={edit}
            />
          ))}
          {remain > 0 && (
            <li className="bg-stone-200 rounded-lg p-2" key="remaining">
              {`残り${remain} Step`}
            </li>
          )}
        </ol>
      </div>
    </div>
  )
}
