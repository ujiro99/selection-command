import { describe, it, expect, vi } from "vitest"
import { resolveIconColors } from "./background"
import type { IconColorQuery, Sender } from "@/services/ipc"

const resolve = (queries: IconColorQuery[]): boolean[] => {
  const response = vi.fn()
  const keepChannelOpen = resolveIconColors(queries, {} as Sender, response)

  // The check is synchronous, so the channel is closed right away.
  expect(keepChannelOpen).toBe(false)
  expect(response).toHaveBeenCalledTimes(1)
  return response.mock.calls[0][0]
}

describe("resolveIconColors", () => {
  it("answers in the order the queries were given", () => {
    expect(
      resolve([
        { url: "https://www.google.com/favicon.ico" },
        { url: "https://cdn3.iconfinder.com/icon.png" },
        { url: "https://www.gstatic.com/images/branding/calendar.png" },
      ]),
    ).toEqual([true, false, true])
  })

  it("recognizes an icon served by the site the command targets", () => {
    expect(
      resolve([
        {
          url: "https://static.company.co.jp/images/logo.png",
          targetUrl: "https://store.company.co.jp/search?q=%s",
        },
        {
          url: "https://other-company.co.jp/images/logo.png",
          targetUrl: "https://store.company.co.jp/search?q=%s",
        },
      ]),
    ).toEqual([true, false])
  })

  it("handles queries with no icon or no target", () => {
    expect(
      resolve([
        {},
        { url: "" },
        { url: "https://cdn.example.com/logo.png" },
        { url: "data:image/png;base64,iVBORw0KGgo" },
      ]),
    ).toEqual([false, false, false, false])
  })
})
