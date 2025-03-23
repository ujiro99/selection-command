import { useEffect, useState } from 'react'
import {
  Disc3,
  Circle,
  Play,
  Square,
  RotateCcw,
  Check,
  CircleDashed,
} from 'lucide-react'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import { PageActionItem } from '@/components/pageAction/PageActionItem'
import { InputPopup } from '@/components/pageAction/InputPopup'
import { InputEditor } from '@/components/pageAction/InputEditor'
import { RemoveDialog } from '@/components/option/RemoveDialog'
import { TypeIcon } from '@/components/pageAction/TypeIcon'
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
import { isEmpty, e2a, cn, capitalize } from '@/lib/utils'
import { PAGE_ACTION_MAX, PAGE_ACTION_CONTROL, EXEC_STATE } from '@/const'

import css from './PageActionRecorder.module.css'

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
  const emptySteps = [...Array(PAGE_ACTION_MAX - 2 - steps.length)]

  // for Editor
  const [editId, setEditId] = useState<string | null>(null)
  const editStep = steps.find((a) => a.id === editId)
  const editorValue = (editStep?.param as PageAction.Input)?.value
  const editorOpen = !isEmpty(editId)

  // for RemoveDialog
  const [removeId, setRemoveId] = useState<string | null>(null)
  const removeStep = steps.find((a) => a.id === removeId)
  const removeOpen = !isEmpty(removeId)

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

  const finish = () => {
    Listener.stop()
    Ipc.send(BgCommand.finishPageActionRecorder)
  }

  const editorSubmit = (value: string) => {
    Ipc.send(BgCommand.updatePageAction, { id: editId, value })
    setEditId(null)
  }

  const removeAction = (id: string | null) => {
    if (id == null) return
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

  const iconSize = 14

  if (!isRecording) return <></>

  return (
    <div className="fixed z-[2147483647] inset-x-0 top-0 p-4 pb-5 bg-gradient-to-b from-gray-900/40">
      <div className="flex flex-col items-center gap-2">
        <div className="controller flex w-[400px] justify-between">
          {isListening ? (
            <button
              type="button"
              className={css.recordButton}
              onClick={() => pause()}
            >
              <Disc3
                size={iconSize + 2}
                strokeWidth="1.5"
                className={css.recordButtonIcon}
              />
              <span className={css.buttonLabelStatus}>Recording...</span>
              <div className={css.buttonHighlight} />
            </button>
          ) : (
            <button
              type="button"
              className={css.recordButton}
              onClick={() => resume()}
            >
              <Circle
                size={iconSize + 2}
                strokeWidth="1.5"
                className="stroke-gray-500 fill-gray-100"
              />
              <p className="flex items-center gap-1">
                <span className={css.buttonLabelStatus}>Not</span>
                <span className={css.buttonLabelStatus}>Recording</span>
              </p>
              <div className={css.buttonHighlight} />
            </button>
          )}

          <div className="flex gap-1">
            <button className={css.button} onClick={() => finish()}>
              <Check size={iconSize} className="stroke-gray-600" />
              <span className={css.buttonLabel}>Finish</span>
              <div className={css.buttonHighlight} />
            </button>

            {isRunning ? (
              <button
                className={css.button}
                onClick={() => Ipc.send(BgCommand.stopPageAction)}
              >
                <Square size={iconSize} className="stroke-gray-600" />
                <span className={css.buttonLabel}>Stop</span>
                <div className={css.buttonHighlight} />
              </button>
            ) : (
              <button className={css.button} onClick={() => preview()}>
                <Play size={iconSize} className="stroke-gray-600" />
                <span className={css.buttonLabel}>Preview</span>
                <div className={css.buttonHighlight} />
              </button>
            )}
            <button className={css.button} onClick={() => reset()}>
              <RotateCcw size={iconSize} className="stroke-gray-600" />
              <span className={css.buttonLabel}>Reset</span>
              <div className={css.buttonHighlight} />
            </button>
          </div>
        </div>
        <div className="timeline relative w-[418px] h-[24px]">
          <ol className="flex items-center h-full">
            {steps.map((step, i) => (
              <PageActionItem
                step={step}
                currentId={currentId}
                failedId={failedId}
                failedMessage={failedMessage}
                key={step.id}
                onClickRemove={setRemoveId}
                onClickEdit={setEditId}
                className={cn(
                  'relative',
                  i > 0 &&
                    "after:content-[''] after:z-[-1] after:absolute after:left-[-25%] after:h-[2px] after:w-[50%] after:bg-gray-500 after:rounded",
                )}
              />
            ))}
            {emptySteps.map((_, i) => (
              <li
                key={i}
                className={cn(
                  'h-[24px] flex-1 flex items-center justify-center relative',
                  (steps.length > 0 || i > 0) &&
                    "after:content-[''] after:z-[-1] after:absolute after:left-[-25%] after:h-[2px] after:w-[50%] after:bg-gray-400/70 after:rounded",
                )}
              >
                <div className="bg-gray-50 rounded-full h-fit w-fit">
                  <CircleDashed
                    size="12"
                    strokeWidth={3}
                    className="stroke-gray-400"
                  />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {!editorOpen && <InputPopup />}
      <InputEditor
        open={editorOpen}
        onOpenChange={(o) => !o && setEditId(null)}
        value={editorValue}
        onSubmit={editorSubmit}
      />
      <RemoveDialog
        open={removeOpen}
        onOpenChange={(o) => !o && setRemoveId(null)}
        onRemove={() => removeAction(removeId)}
      >
        {removeStep && (
          <div>
            <p className="text-base font-medium font-mono flex items-center gap-1.5">
              <TypeIcon
                type={removeStep.type}
                className="stroke-gray-700 mr-2"
                size={20}
              />
              {capitalize(removeStep.type)}
            </p>
            <p className="text-balance whitespace-pre-line text-sm mt-4">
              <span>{removeStep.param.label}</span>
            </p>
          </div>
        )}
      </RemoveDialog>
    </div>
  )
}
