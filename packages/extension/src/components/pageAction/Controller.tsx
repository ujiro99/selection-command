import { useEffect, useState, forwardRef } from "react"
import {
  Disc3,
  Circle,
  Play,
  Square,
  RotateCcw,
  Check,
  LoaderCircle,
} from "lucide-react"
import { StepList } from "@/components/pageAction/StepList"
import { usePageActionContext } from "@/hooks/pageAction/usePageActionContext"
import { useZoomCompensation } from "@/hooks/usePageZoom"
import { PageActionListener as Listener } from "@/services/pageAction"
import { Ipc, ServiceWorkerCommand, RunPageAction } from "@/services/ipc"
import { t } from "@/services/i18n"
import type { PageActionStep, PageActiontResult, DeepPartial } from "@/types"
import { cn } from "@/lib/utils"
import {
  PAGE_ACTION_OPEN_MODE,
  PAGE_ACTION_EXEC_STATE as EXEC_STATE,
} from "@/const"
import { TEST_IDS } from "@/testIds"

import zc from "@/components/zoomCompensation.module.css"
import css from "./PageActionRecorder.module.css"

type Props = {
  steps: PageActionStep[]
  isRecordEnabled: boolean
  onClickRemove: (id: string) => void
  onClickEdit: (id: string) => void
  onChange: (id: string, partial: DeepPartial<PageActionStep>) => void
}

export const Controller = forwardRef<HTMLDivElement, Props>(
  ({ isRecordEnabled, ...props }: Props, ref): JSX.Element => {
    const [isListening, setIsListening] = useState(true)
    const [hover, setHover] = useState(false)

    const { isRecording, isRunning, status } = usePageActionContext()
    const zoomCompensation = useZoomCompensation()
    const results = status?.results
    const currentId = status?.stepId
    const f = results?.find(
      (r: PageActiontResult) => r.status === EXEC_STATE.Failed,
    )
    const failedId = f?.stepId
    const failedMessage = f?.message ?? ""

    const preview = () => {
      setTimeout(() => {
        // Start preview.
        Ipc.send<RunPageAction>(ServiceWorkerCommand.previewPageAction, {
          steps: props.steps,
          openMode: PAGE_ACTION_OPEN_MODE.NONE,
          srcUrl: `{{${t("PageAction_InputMenu_url")}}}`,
          selectedText: `{{${t("PageAction_InputMenu_selectedText")}}}`,
          clipboardText: `{{${t("PageAction_InputMenu_clipboard")}}}`,
        })
      }, 100)
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
      Ipc.send(ServiceWorkerCommand.resetPageAction)
    }

    const finish = () => {
      Listener.stop()
      Ipc.send(ServiceWorkerCommand.finishPageActionRecorder)
    }

    useEffect(() => {
      if (isRunning || !isRecordEnabled) {
        pause()
      } else {
        isRecording && resume()
      }
      return () => {
        pause()
      }
    }, [isRunning, isRecording, isRecordEnabled])

    const iconSize = 14 * zoomCompensation
    const statusIconSize = 16 * zoomCompensation

    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 w-fit pointer-events-auto",
          "backdrop-blur-sm bg-gray-100/60 dark:bg-gray-900/80 rounded-md py-4 pl-5 pr-3 shadow-md",
          zc.rounded,
          zc.shadowMd,
        )}
        ref={ref}
        data-hover={hover}
      >
        <div className="controller flex w-100 justify-between">
          {isListening ? (
            <button
              type="button"
              className={css.recordButton}
              onClick={() => pause()}
            >
              <Disc3
                size={statusIconSize}
                strokeWidth="1.5"
                className={css.recordButtonIcon}
              />
              <span className={css.buttonLabelStatus}>
                {t("PageAction_Controller_recording")}...
              </span>
            </button>
          ) : isRunning ? (
            <div className="flex items-center gap-1.5 p-1 py-0.5">
              <LoaderCircle
                size={statusIconSize}
                strokeWidth="1.5"
                className="stroke-sky-500 animate-spin"
              />
              <span className={css.buttonLabelStatus}>
                {t("PageAction_Controller_previewing")}
              </span>
            </div>
          ) : (
            <button
              type="button"
              className={css.recordButton}
              onClick={() => resume()}
            >
              <Circle
                size={statusIconSize}
                strokeWidth="1.5"
                className="stroke-gray-500 dark:stroke-gray-400 fill-gray-100 dark:fill-gray-700"
              />
              <span className={css.buttonLabelStatus}>
                {t("PageAction_Controller_not_recording")}
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              className={css.button}
              onClick={() => finish()}
              data-testid={TEST_IDS.pageActionCompleteButton}
            >
              <Check
                size={iconSize}
                className="stroke-gray-600 dark:stroke-gray-400"
              />
              <span className={css.buttonLabel}>
                {t("PageAction_Controller_complete")}
              </span>
            </button>

            {isRunning ? (
              <button
                className={css.button}
                onClick={() => Ipc.send(ServiceWorkerCommand.stopPageAction)}
              >
                <Square
                  size={iconSize}
                  className="stroke-gray-600 dark:stroke-gray-400"
                />
                <span className={css.buttonLabel}>
                  {t("PageAction_Controller_stop")}
                </span>
              </button>
            ) : (
              <button className={css.button} onClick={() => preview()}>
                <Play
                  size={iconSize}
                  className="stroke-gray-600 dark:stroke-gray-400"
                />
                <span className={css.buttonLabel}>
                  {t("PageAction_Controller_preview")}
                </span>
              </button>
            )}
            <button className={css.button} onClick={() => reset()}>
              <RotateCcw
                size={iconSize}
                className="stroke-gray-600 dark:stroke-gray-400"
              />
              <span className={css.buttonLabel}>
                {t("PageAction_Controller_reset")}
              </span>
            </button>
          </div>
        </div>
        <div className="timeline relative w-104.5 h-6">
          <StepList
            steps={props.steps}
            currentId={currentId}
            failedId={failedId}
            failedMessage={failedMessage}
            onClickRemove={props.onClickRemove}
            onClickEdit={props.onClickEdit}
            onChange={props.onChange}
            onChangeHover={setHover}
          />
        </div>
      </div>
    )
  },
)
