export function PageActionField(props) {
  const start = () => {
    console.log('start')
  }

  return (
    <div className="">
      <button onClick={start}>Start Record</button>
    </div>
  )
}
