import { useEffect, useState, forwardRef } from 'react'
import { Disc3, Circle, Play, Square, RotateCcw, Check } from 'lucide-react'
import { StepList } from '@/components/pageAction/StepList'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import {
  PageActionListener as Listener,
  RunningStatus,
} from '@/services/pageAction'
import { Ipc, BgCommand, RunPageAction } from '@/services/ipc'
import { getSelectionText } from '@/services/dom'
import { t } from '@/services/i18n'
import type { PageActiontStatus, PageActionStep } from '@/types'
import { e2a, cn } from '@/lib/utils'
import { PAGE_ACTION_CONTROL, PAGE_ACTION_OPEN_MODE, EXEC_STATE } from '@/const'

import css from './PageActionRecorder.module.css'

const isControlType = (type: string): boolean => {
  return e2a(PAGE_ACTION_CONTROL).includes(type)
}

type Props = {
  steps: PageActionStep[]
  onClickRemove: (id: string) => void
  onClickEdit: (id: string) => void
}

export const Controller = forwardRef<HTMLDivElement, Props>(
  (props: Props, ref): JSX.Element => {
    const { isRecording, isRunning } = usePageActionContext()
    const [isListening, setIsListening] = useState(true)
    const [currentId, setCurrentId] = useState<string>()
    const [failedId, setFailedId] = useState<string>()
    const [failedMessage, setFailedMesage] = useState<string>()
    const [hover, setHover] = useState(false)

    const clearState = () => {
      setCurrentId('')
      setFailedId('')
      setFailedMesage('')
    }

    const preview = () => {
      setTimeout(async () => {
        // Wait for the clipboard to be updated.
        const text = await navigator.clipboard.readText()
        // Start preview.
        Ipc.send<RunPageAction>(BgCommand.runPageAction, {
          steps: props.steps,
          openMode: PAGE_ACTION_OPEN_MODE.NONE,
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

    const reset = () => {
      clearState()
      Ipc.send(BgCommand.resetPageAction)
    }

    const finish = () => {
      Listener.stop()
      Ipc.send(BgCommand.finishPageActionRecorder)
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
      RunningStatus.subscribe(onStatusChange)
      return () => {
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

    return (
      <div
        className={cn(
          'flex flex-col items-center gap-2 w-fit pointer-events-auto',
          'backdrop-blur-md bg-gray-200/40 rounded-md p-4 pr-3 shadow-md',
        )}
        ref={ref}
        data-hover={hover}
      >
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
          <StepList
            steps={props.steps}
            currentId={currentId}
            failedId={failedId}
            failedMessage={failedMessage}
            onClickRemove={props.onClickRemove}
            onClickEdit={props.onClickEdit}
            onChangeHover={setHover}
          />
        </div>
      </div>
    )
  },
)
