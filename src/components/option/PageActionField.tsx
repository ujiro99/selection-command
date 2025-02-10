import type { FieldProps } from '@rjsf/utils'

export function PageActionField(props: FieldProps) {
  const { formData, uiSchema } = props

  console.log('PageActionField', formData, uiSchema)

  const start = () => {
    console.log('start')
  }

  return (
    <div className="">
      <button onClick={start}>Start Record</button>
    </div>
  )
}
