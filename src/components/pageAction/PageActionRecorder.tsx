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
import type { PageAction } from '@/services/pageAction'
import { Storage, SESSION_STORAGE_KEY as STORAGE_KEY } from '@/services/storage'
import { Ipc, BgCommand } from '@/services/ipc'
import { getSelectionText } from '@/services/dom'
import type { PageActionStep } from '@/types'
import { isEmpty, e2a } from '@/lib/utils'
import { PAGE_ACTION_MAX, PAGE_ACTION_CONTROL } from '@/const'

const isControlType = (type: string): boolean => {
  return e2a(PAGE_ACTION_CONTROL).includes(type)
}

export function PageActionRecorder(): JSX.Element {
  const Runner = usePageActionRunner()
  const { isRunning } = Runner
  const { isRecording: isOpen, setContextData } = usePageActionContext()
  const [steps, setSteps] = useState<PageActionStep[]>([])
  const [isRecording, setIsRecording] = useState(true)
  const [currentId, setCurrentId] = useState<string>()
  const [failedId, setFailedId] = useState<string>()
  const [failedMessage, setFailedMesage] = useState<string>('')
  const [previewElm, setPreviewElm] = useState<HTMLButtonElement | null>()
  const remain = PAGE_ACTION_MAX - steps.length - 2 // - 2: start, end

  // for Editor
  const [editId, setEditId] = useState<string | null>(null)
  const inputAction = steps.find((a) => a.id === editId)
  const editorValue = (inputAction?.param as PageAction.Input)?.value
  const editorOpen = !isEmpty(editId)

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

      // TODO: Reload
      const url = (steps[0].param as PageAction.Start).url as string
      if (url) {
        location.href = url
      }

      Runner.run(steps)
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

  const finish = () => {
    Ipc.send(BgCommand.finishPageActionRecorder)
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
    const addStep = (list: PageActionStep[]) => {
      setSteps((list ?? []).filter((l) => !isControlType(l.type)))
    }

    const init = async () => {
      const actions = await Storage.get<PageActionStep[]>(
        STORAGE_KEY.PAGE_ACTION,
      )
      addStep(actions)
    }
    init()

    Storage.addListener(STORAGE_KEY.PAGE_ACTION, addStep)
    Runner.subscribe(RunnerEvent.Start, onStart)
    Runner.subscribe(RunnerEvent.Failed, onFailed)

    return () => {
      Storage.removeListener(STORAGE_KEY.PAGE_ACTION, addStep)
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

  return isOpen ? (
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
            onClick={() => finish()}
          >
            Finish
          </button>
          <button
            className="bg-stone-300 rounded-lg p-2 pointer-events-auto"
            onClick={() => reset()}
          >
            Reset
          </button>
        </div>
        <ol className="flex flex-wrap w-[500px] gap-2 mt-2">
          {steps.map((action) => (
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
  ) : (
    <></>
  )
}
