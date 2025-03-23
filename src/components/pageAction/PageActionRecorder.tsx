import { useEffect, useState } from 'react'
import { usePageActionContext } from '@/hooks/pageAction/usePageActionContext'
import { InputPopup } from '@/components/pageAction/InputPopup'
import { InputEditor } from '@/components/pageAction/InputEditor'
import { RemoveDialog } from '@/components/option/RemoveDialog'
import { TypeIcon } from '@/components/pageAction/TypeIcon'
import { Controller } from '@/components/pageAction/Controller'
import type { PageAction } from '@/services/pageAction'
import { Storage, SESSION_STORAGE_KEY as STORAGE_KEY } from '@/services/storage'
import { Ipc, BgCommand } from '@/services/ipc'
import type { PageActionRecorder, PageActionStep } from '@/types'
import { isEmpty, capitalize } from '@/lib/utils'

export function PageActionRecorder(): JSX.Element {
  const { isRecording } = usePageActionContext()
  const [steps, setSteps] = useState<PageActionStep[]>([])

  // for Editor
  const [editId, setEditId] = useState<string | null>(null)
  const editStep = steps.find((a) => a.id === editId)
  const editorValue = (editStep?.param as PageAction.Input)?.value
  const editorOpen = !isEmpty(editId)

  // for RemoveDialog
  const [removeId, setRemoveId] = useState<string | null>(null)
  const removeStep = steps.find((a) => a.id === removeId)
  const removeOpen = !isEmpty(removeId)

  const editorSubmit = (value: string) => {
    Ipc.send(BgCommand.updatePageAction, { id: editId, value })
    setEditId(null)
  }

  const removeAction = (id: string | null) => {
    if (id == null) return
    Ipc.send(BgCommand.removePageAction, { id })
  }

  useEffect(() => {
    const addStep = (steps: PageActionStep[]) => {
      setSteps(steps ?? [])
    }
    const init = async () => {
      const { steps } = await Storage.get<PageActionRecorder>(
        STORAGE_KEY.PA_RECORDING,
      )
      addStep(steps)
    }
    init()
    Storage.addListener<PageActionRecorder>(
      STORAGE_KEY.PA_RECORDING,
      ({ steps }) => addStep(steps),
    )
    return () => {
      Storage.removeListener(STORAGE_KEY.PA_RECORDING, addStep)
    }
  }, [])

  if (!isRecording) return <></>

  return (
    <div className="fixed z-[2147483647] inset-x-0 top-0 p-4 pb-5 bg-gradient-to-b from-gray-900/40">
      <Controller
        steps={steps}
        onClickRemove={setRemoveId}
        onClickEdit={setEditId}
      />
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
