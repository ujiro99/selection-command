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
