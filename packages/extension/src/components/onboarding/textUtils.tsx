import { Fragment, type ReactNode } from "react"

// Locale strings use "\n" for line breaks instead of embedding <br> tags
// directly, so translators editing messages.json only ever see plain text.
// This converts that "\n" into actual <br> elements at render time.
export function renderMultiline(text: string): ReactNode {
  const lines = text.split("\n")
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ))
}

// Splits `text` around the first occurrence of `word`, or returns null when
// there is no usable word to mark (in which case the card falls back to the
// drag gesture rather than asking to double-click a word that isn't there).
export function splitTargetWord(
  text: string,
  word: string | undefined,
): { before: string; word: string; after: string } | null {
  if (!word) return null
  const index = text.indexOf(word)
  if (index < 0) return null
  return {
    before: text.slice(0, index),
    word,
    after: text.slice(index + word.length),
  }
}
