import type { ExecuteCommandParams } from '@/types'
import { TextStyle } from '@/components/result/TextStyle'

export const GetStyles = {
  async execute({ target }: ExecuteCommandParams) {
    if (!target) {
      return
    }

    const styles = getFontCSS(target as HTMLElement)

    return <TextStyle styles={styles} />
  },
}

const CANVAS_OPTIONS = {
  fillStyle: 'rgb(0,0,0)',
  height: 50,
  size: '40px',
  textBaseline: 'top',
  width: 600,
}

function getFontOption(css: FontCSS) {
  return `${css.fontStyle} ${css.fontWeight} ${CANVAS_OPTIONS.size} ${css.fontFamily}`
}

function getCanvasData(css: FontCSS, text = 'abcdefghijklmnopqrstuvwxyz') {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_OPTIONS.width
  canvas.height = CANVAS_OPTIONS.height

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  Object.assign(ctx, CANVAS_OPTIONS)

  ctx.font = getFontOption(css)
  ctx.fillText(text, 0, 0)

  return canvas
    .getContext('2d')
    ?.getImageData(0, 0, CANVAS_OPTIONS.width, CANVAS_OPTIONS.height).data
}

function isFontEqual(leftCss: FontCSS, rightCss: FontCSS) {
  const left = getCanvasData(leftCss)
  const right = getCanvasData(rightCss)

  if (!left || !right) return false

  if (left.length !== right.length) {
    return false
  }

  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) {
      return false
    }
  }

  return true
}

const getActiveFont = (css: FontCSS) => {
  const stack = css.fontFamily.split(/,\s*/)

  for (let f = 0; f < stack.length; f++) {
    const serifStyle = {
      ...css,
      fontFamily: stack[f] + ', serif',
    }
    const sansSerifStyle = {
      ...css,
      fontFamily: stack[f] + ', sans-serif',
    }

    if (
      isFontEqual(serifStyle, sansSerifStyle) &&
      isFontEqual(serifStyle, css)
    ) {
      return stack[f]
    }
  }
  return css.fontFamily
}

function getFontCSS(element: HTMLElement): FontCSS {
  const computed = getComputedStyle(element)

  return {
    fontFamily: getActiveFont(computed),
    fontWeight: computed.getPropertyValue('font-weight') || 'normal',
    fontStyle: computed.getPropertyValue('font-style') || 'normal',
    fontSize: computed.getPropertyValue('font-size'),
    color: computed.getPropertyValue('color'),
    lineHeight: computed.getPropertyValue('line-height'),
    letterSpacing: computed.getPropertyValue('letter-spacing'),
  }
}
