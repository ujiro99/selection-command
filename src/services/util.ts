/**
 * Stops processing for the specified time.
 * @param {number} msec Sleep time in millisconds
 */
export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

export function toDataURL(src: string, outputFormat?: string) {
  return new Promise((resolve) => {
    let img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function () {
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      ctx.drawImage(this, 0, 0)
      let dataURL = canvas.toDataURL(outputFormat)
      resolve(dataURL)
    }
    img.src = src
  })
}

export function toUrl(searchUrl: string, text: string): string {
  let textEscaped = text.replaceAll(' ', '+')
  textEscaped = encodeURI(textEscaped)
  return searchUrl.replace('%s', textEscaped)
}
