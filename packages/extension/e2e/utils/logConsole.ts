import type { ConsoleMessage, Page, Worker } from "@playwright/test"

function attachConsoleListener(target: Page | Worker, prefix: string): void {
  target.on("console", async (msg: ConsoleMessage) => {
    if (!process.env.PWDEBUG) return
    try {
      const type = msg.type().charAt(0).toUpperCase()
      const location = msg.location()
      const header = `${prefix}[${type}]`
      const footer = `@ ${location.url}:${location.lineNumber}`

      const args = await Promise.all(msg.args().map((a) => a.jsonValue()))
      const formatted = args.map((v) =>
        typeof v === "string" ? v : JSON.stringify(v, null, 2),
      )

      console.log(header, " ", ...formatted, "\n  ", footer)
    } catch (e) {
      console.log(
        `${prefix}[${msg.type().charAt(0).toUpperCase()}]:`,
        msg.text(),
      )
      console.warn(`Failed to process console message from ${prefix}`)
    }
  })
}

export function attachConsole(page: Page): void {
  attachConsoleListener(page, "Browser")
}

export function attachSWConsole(sw: Worker): void {
  attachConsoleListener(sw, "SW")
}
