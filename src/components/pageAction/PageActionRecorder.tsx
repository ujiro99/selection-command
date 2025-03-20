import { useEffect, useState } from 'react'
import { Circle } from 'lucide-react'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import { PageActionItem } from '@/components/pageAction/PageActionItem'
import { InputPopup } from '@/components/pageAction/InputPopup'
import { InputEditor } from '@/components/pageAction/InputEditor'
import {
  PageActionListener as Listener,
  RunningStatus,
} from '@/services/pageAction'
import type { PageAction } from '@/services/pageAction'
import { Storage, SESSION_STORAGE_KEY as STORAGE_KEY } from '@/services/storage'
import { Ipc, BgCommand, RunPageAction } from '@/services/ipc'
import { getSelectionText } from '@/services/dom'
import { t } from '@/services/i18n'
import type {
  PageActiontStatus,
  PageActionOption,
  PageActionStep,
} from '@/types'
import { isEmpty, e2a } from '@/lib/utils'
import { PAGE_ACTION_MAX, PAGE_ACTION_CONTROL, EXEC_STATE } from '@/const'

const isControlType = (type: string): boolean => {
  return e2a(PAGE_ACTION_CONTROL).includes(type)
}

export function PageActionRecorder(): JSX.Element {
  const { isRecording, isRunning } = usePageActionContext()
  const [_steps, setSteps] = useState<PageActionStep[]>([])
  const [isListening, setIsListening] = useState(true)
  const [currentId, setCurrentId] = useState<string>()
  const [failedId, setFailedId] = useState<string>()
  const [failedMessage, setFailedMesage] = useState<string>()
  const steps = _steps.filter((l) => !isControlType(l.type))
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
      // Start preview.
      Ipc.send<RunPageAction>(BgCommand.runPageAction, {
        steps: _steps,
        srcUrl: t('PageAction_InputMenu_url'),
        selectedText: getSelectionText(),
        clipboardText: text,
      })
    }, 100)
    clearState()
    Listener.stop()
  }

  const pause = () => {
    setIsListening(false)
    Listener.stop()
  }

  const resume = () => {
    setIsListening(true)
    Listener.start()
  }

  const edit = (id: string) => {
    setEditId(id)
  }

  const finish = () => {
    Listener.stop()
    Ipc.send(BgCommand.finishPageActionRecorder)
  }

  const editorSubmit = (value: string) => {
    Ipc.send(BgCommand.updatePageAction, { id: editId, value })
    setEditId(null)
  }

  const removeAction = (id: string) => {
    Ipc.send(BgCommand.removePageAction, { id })
  }

  const onStatusChange = ({ results }: PageActiontStatus) => {
    const r = results.find((r) => r.status === EXEC_STATE.Start)
    if (r != null) {
      setCurrentId(r.stepId)
    }
    const f = results.find((r) => r.status === EXEC_STATE.Failed)
    if (f != null) {
      setFailedId(f?.stepId)
      setFailedMesage(f.message)
    }
  }

  useEffect(() => {
    const addStep = (steps: PageActionStep[]) => {
      setSteps(steps ?? [])
    }

    const init = async () => {
      const { steps } = await Storage.get<PageActionOption>(
        STORAGE_KEY.PA_RECORDING,
      )
      addStep(steps)
    }
    init()

    Storage.addListener<PageActionOption>(
      STORAGE_KEY.PA_RECORDING,
      ({ steps }) => addStep(steps),
    )
    RunningStatus.subscribe(onStatusChange)

    return () => {
      Storage.removeListener(STORAGE_KEY.PA_RECORDING, addStep)
      RunningStatus.unsubscribe(onStatusChange)
    }
  }, [])

  useEffect(() => {
    if (isRunning) {
      pause()
    } else {
      isRecording && resume()
    }
    return () => {
      pause()
    }
  }, [isRunning, isRecording])

  return isRecording ? (
    <>
      <div className="fixed z-[2147483647] inset-x-0 top-0 p-3 bg-gradient-to-b from-gray-900/30">
        <div className="flex justify-center">
          {isListening ? (
            <div className="flex items-center gap-2">
              <Circle
                size="18"
                className="stroke-red-600 fill-red-600 drop-shadow-md shadow-red-600 animate-pulse"
              />
              <span className="text-sm font-mono">Recording...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Circle size="18" className="stroke-gray-600 fill-gray-100" />
              <span className="text-sm font-mono">Not Recording</span>
            </div>
          )}
        </div>
      </div>
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
            {isListening ? (
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
                onClick={() => Ipc.send(BgCommand.stopPageAction)}
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
            {steps.map((step) => (
              <PageActionItem
                step={step}
                currentId={currentId}
                failedId={failedId}
                failedMessage={failedMessage}
                key={step.id}
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
    </>
  ) : (
    <></>
  )
}
