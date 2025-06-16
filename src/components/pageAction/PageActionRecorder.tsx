import { useEffect, useState } from 'react'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { DndContext, DragEndEvent } from '@dnd-kit/core'

import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import { InputPopup } from '@/components/pageAction/InputPopup'
import { InputEditor } from '@/components/pageAction/InputEditor'
import { RemoveDialog } from '@/components/option/RemoveDialog'
import { TypeIcon } from '@/components/pageAction/TypeIcon'
import { Controller } from '@/components/pageAction/Controller'
import { Draggable } from '@/components/pageAction/Draggable'

import type { PageAction } from '@/services/pageAction'
import { Storage, SESSION_STORAGE_KEY as STORAGE_KEY } from '@/services/storage'
import { Ipc, BgCommand, TabCommand } from '@/services/ipc'
import type {
  PageActionRecorderOption,
  PageActionRecordingData,
  PageActionStep,
  PopupOption,
  Point,
  DeepPartial,
} from '@/types'
import { isEmpty, capitalize } from '@/lib/utils'
import { ANALYTICS_EVENTS, sendEvent } from '@/services/analytics'
import { SCREEN } from '@/const'

export function PageActionRecorder(): JSX.Element {
  const { isRecording } = usePageActionContext()
  const [steps, setSteps] = useState<PageActionStep[]>([])
  const [windowSize, setWindowSize] = useState<PopupOption>({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const [position, setPosition] = useState<Point | undefined>()
  const [controllerElm, setControllerElm] = useState<HTMLDivElement | null>()

  // for Editor
  const [editId, setEditId] = useState<string | null>(null)
  const editStep = steps.find((a) => a.id === editId)
  const editorValue = (editStep?.param as PageAction.Input)?.value
  const editorOpen = !isEmpty(editId)

  // for RemoveDialog
  const [removeId, setRemoveId] = useState<string | null>(null)
  const removeStep = steps.find((a) => a.id === removeId)
  const removeOpen = !isEmpty(removeId)
  const hasLabel = !isEmpty(removeStep?.param.label)

  const editInputAction = (value: string) => {
    Ipc.send(BgCommand.updatePageAction, { id: editId, partial: { value } })
    setEditId(null)
  }

  const handleOnChangeStep = (
    id: string,
    partial: DeepPartial<PageActionStep>,
  ) => {
    Ipc.send(BgCommand.updatePageAction, { id, partial })
  }

  const removeAction = (id: string | null) => {
    if (id == null) return
    Ipc.send(BgCommand.removePageAction, { id })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (event.active.rect.current.translated == null) return
    const newPos = {
      x: event.active.rect.current.translated?.left,
      y: event.active.rect.current.translated?.top,
    }
    setPosition(newPos)
    Storage.get<PageActionRecorderOption>(STORAGE_KEY.PA_RECORDER_OPTION).then(
      (data) => {
        Storage.set(STORAGE_KEY.PA_RECORDER_OPTION, {
          ...data,
          controllerPosition: newPos,
        })
      },
    )
  }

  useEffect(() => {
    sendEvent(
      ANALYTICS_EVENTS.OPEN_DIALOG,
      {
        event_label: 'pageAction_recorder',
      },
      SCREEN.OPTION,
    )
  }, [])

  useEffect(() => {
    const update = (data: PageActionRecordingData) => {
      data?.steps && setSteps(data.steps ?? [])
    }
    const update2 = (opt: PageActionRecorderOption) => {
      opt?.controllerPosition && setPosition(opt.controllerPosition)
    }
    Storage.get<PageActionRecordingData>(STORAGE_KEY.PA_RECORDING).then(update)
    Storage.get<PageActionRecorderOption>(STORAGE_KEY.PA_RECORDER_OPTION).then(
      update2,
    )
    Storage.addListener<PageActionRecordingData>(
      STORAGE_KEY.PA_RECORDING,
      update,
    )
    Storage.addListener<PageActionRecorderOption>(
      STORAGE_KEY.PA_RECORDER_OPTION,
      update2,
    )
    return () => {
      Storage.removeListener(STORAGE_KEY.PA_RECORDING, update)
      Storage.removeListener(STORAGE_KEY.PA_RECORDER_OPTION, update2)
    }
  }, [])

  useEffect(() => {
    const listener = (param: any, _sender: any, _response: any) => {
      const update = async () => {
        const data = await Storage.get<PageActionRecordingData>(
          STORAGE_KEY.PA_RECORDING,
        )
        data.size = param as PopupOption
        await Storage.set<PageActionRecordingData>(
          STORAGE_KEY.PA_RECORDING,
          data,
        )
        setWindowSize(param)
      }
      update()
      return false
    }
    Ipc.addListener(TabCommand.sendWindowSize, listener)
    return () => {
      Ipc.removeListener(TabCommand.sendWindowSize)
    }
  }, [])

  useEffect(() => {
    if (controllerElm && position) {
      const rect = controllerElm.getBoundingClientRect()
      const over =
        windowSize.width < position.x + rect.width ||
        windowSize.height < position.y + rect.height
      if (over) {
        setPosition(undefined)
      }
    }
  }, [controllerElm, position, windowSize])

  if (!isRecording) return <></>

  return (
    <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToParentElement]}>
      <div className="fixed inset-0 pointer-events-none z-[2147483647]">
        <Draggable id="controller" position={position} className="z-10">
          <Controller
            steps={steps}
            onClickRemove={setRemoveId}
            onClickEdit={setEditId}
            onChange={handleOnChangeStep}
            isRecordEnabled={!(editorOpen || removeOpen)}
            ref={setControllerElm}
          />
        </Draggable>
        {!editorOpen && <InputPopup />}
        <InputEditor
          open={editorOpen}
          onOpenChange={(o) => !o && setEditId(null)}
          value={editorValue}
          onSubmit={editInputAction}
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
                  type={removeStep.param.type}
                  className="stroke-gray-700"
                  size={20}
                />
                {capitalize(removeStep.param.type)}
              </p>
              {hasLabel && (
                <p className="mt-2 px-3 py-2 rounded-md text-balance whitespace-pre-line text-sm max-h-80 overflow-x-hidden overflow-y-auto bg-gray-100">
                  <span>{removeStep.param.label}</span>
                </p>
              )}
            </div>
          )}
        </RemoveDialog>
      </div>
    </DndContext>
  )
}
