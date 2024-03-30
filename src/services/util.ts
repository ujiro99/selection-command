/**
 * Stops processing for the specified time.
 * @param {number} msec Sleep time in millisconds
 */
export function sleep(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec))
}

function uniq<T>(array: Array<T>): Array<T> {
  return array.filter((elem, index, self) => self.indexOf(elem) === index)
}

export function toDataURL(src: string, outputFormat?: string): Promise<string> {
  return new Promise((resolve) => {
    let img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = function () {
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      canvas.height = this.naturalHeight
      canvas.width = this.naturalWidth
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
  return searchUrl?.replace('%s', textEscaped)
}

export function linksInSelection(): string[] {
  const selection = document.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return []
  }
  const range = selection.getRangeAt(0)
  if (!range) {
    return []
  }
  const link = linkAtContainer(range)
  let links = linksInRange(range)
  links = link ? [link, ...links] : links
  return uniq(links)
}

function linkAtContainer(range: Range): string | undefined {
  let parent = range.commonAncestorContainer as HTMLElement | null
  while (parent) {
    if (parent.tagName === 'A') {
      return (parent as HTMLAnchorElement).href
    }
    parent = parent.parentElement
  }
}

function linksInRange(range: Range): string[] {
  const anchors = range.cloneContents().querySelectorAll('a')
  if (!anchors) {
    return []
  }
  const links = []
  for (const a of anchors) {
    links.push(a.href)
  }
  return links
}

export function getSceenSize(): { w: number; h: number } {
  return { w: window.screen.width, h: window.screen.height }
}

export function escapeJson(str: string) {
  return str
    .replace(/[\\]/g, '\\\\')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t')
    .replace(/[\"]/g, '\\"')
    .replace(/\\'/g, "\\'")
}
