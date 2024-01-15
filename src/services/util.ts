/**
 * Stops processing for the specified time.
 * @param {number} msec Sleep time in millisconds
 */
export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

export function toDataURL(url: string): Promise<string> {
  const xhr = new XMLHttpRequest()
  return new Promise((resolve) => {
    xhr.onload = function () {
      let reader = new FileReader()
      reader.onloadend = function () {
        resolve(reader.result as string)
      }
      reader.readAsDataURL(xhr.response)
    }
    xhr.open('GET', url)
    xhr.responseType = 'blob'
    xhr.send()
  })
}
