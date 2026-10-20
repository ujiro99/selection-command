import type { BrowserContext } from "@playwright/test"
import { test, expect } from "./fixtures"
import { OptionsPage } from "./pages/OptionsPage"
import { TestPage } from "./pages/TestPage"
import { readFileSync } from "node:fs"

const testSettings = JSON.parse(
  readFileSync(new URL("./data/test-settings.json", import.meta.url), "utf-8"),
)

async function runShortcut(context: BrowserContext) {
  const worker = context.serviceWorkers()[0]
  await worker.evaluate(async () => {
    const workerGlobal = globalThis as typeof globalThis & {
      __e2eHandleShortcutCommand: (commandName: string) => Promise<void>
    }
    await workerGlobal.__e2eHandleShortcutCommand("slot_1")
  })
}

async function expectSearch(context: BrowserContext, text: string) {
  const resultPromise = context.waitForEvent("page")
  await runShortcut(context)
  const result = await resultPromise
  await expect(result).toHaveURL(
    `https://ujiro99.github.io/selection-command/en/test?k=${encodeURIComponent(text).replaceAll("%20", "+")}`,
  )
}

test.describe("検索ショートカット", () => {
  test.beforeEach(async ({ context, extensionId, getCommands }) => {
    const options = new OptionsPage(context, extensionId, getCommands)
    await options.importSettings({
      ...testSettings,
      shortcuts: {
        shortcuts: [
          {
            id: "slot_1",
            commandId: "13b4e831-7fac-4b72-a1ae-c82655b3819e",
            noSelectionBehavior: "useClipboard",
          },
          {
            id: "slot_2",
            commandId: "13b4e831-7fac-4b72-a1ae-c82655b3819e",
            noSelectionBehavior: "doNothing",
          },
        ],
      },
    })
    await options.close()
  })

  test("E2E-100: slot_1で検索コマンドが実行され選択テキストが渡る", async ({
    context,
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await page.bringToFront()
    await testPage.selectText("h2")
    const selection = await page.evaluate(() =>
      window.getSelection()!.toString(),
    )
    expect(selection).not.toBe("")
    await expectSearch(context, selection)
  })

  test("E2E-101: 選択テキストの日本語・空白・記号が検索URLへ渡る", async ({
    context,
    page,
  }) => {
    const testPage = new TestPage(page)
    await testPage.open()
    await page.bringToFront()
    const text = "日本語 space & + ?"
    await page
      .locator("h2")
      .first()
      .evaluate((element, text) => {
        element.textContent = text
        const range = document.createRange()
        range.selectNodeContents(element)
        window.getSelection()!.removeAllRanges()
        window.getSelection()!.addRange(range)
      }, text)
    await expectSearch(context, text)
  })

  test("E2E-102: 未選択時にクリップボードから検索する", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await new TestPage(page).open()
    await page.bringToFront()
    const text = "clipboard 日本語 & test"
    await page.evaluate(async (text) => {
      window.getSelection()!.removeAllRanges()
      await navigator.clipboard.writeText(text)
    }, text)
    await expectSearch(context, text)
  })

  test("E2E-103: DO_NOTHING設定では未選択時に実行しない", async ({
    context,
    page,
  }) => {
    await new TestPage(page).open()
    await page.bringToFront()
    await page.evaluate(() => window.getSelection()!.removeAllRanges())
    const worker = context.serviceWorkers()[0]
    const before = await worker.evaluate(() => chrome.tabs.query({}))
    await worker.evaluate(async () => {
      const workerGlobal = globalThis as typeof globalThis & {
        __e2eHandleShortcutCommand: (commandName: string) => Promise<void>
      }
      await workerGlobal.__e2eHandleShortcutCommand("slot_2")
    })
    const after = await worker.evaluate(() => chrome.tabs.query({}))
    expect(after.map(({ id, url }) => ({ id, url }))).toEqual(
      before.map(({ id, url }) => ({ id, url })),
    )
  })

  test("E2E-104: Content Scriptのないchrome://ページではService Workerから実行する", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await new TestPage(page).open()
    await page.bringToFront()
    const text = "fallback clipboard"
    await page.evaluate((text) => navigator.clipboard.writeText(text), text)
    await page.goto("chrome://version")
    await expectSearch(context, text)
  })

  test("E2E-105: chrome.commands.getAllでslot_1〜slot_3が登録されている", async ({
    context,
  }) => {
    const commands = await context
      .serviceWorkers()[0]
      .evaluate(() => chrome.commands.getAll())
    for (const name of ["slot_1", "slot_2", "slot_3"]) {
      expect(commands).toContainEqual(
        expect.objectContaining({
          name,
          description: expect.any(String),
          shortcut: expect.any(String),
        }),
      )
    }
  })
})

const pageActionCases = [
  {
    id: "E2E-106",
    openMode: "popup",
    variable: "Clipboard",
    hasSelection: false,
  },
  {
    id: "E2E-107",
    openMode: "backgroundTab",
    variable: "Clipboard",
    hasSelection: false,
  },
  {
    id: "E2E-108",
    openMode: "popup",
    variable: "SelectedText",
    hasSelection: true,
  },
  {
    id: "E2E-109",
    openMode: "popup",
    variable: "SelectedText",
    hasSelection: false,
  },
  {
    id: "E2E-110",
    openMode: "backgroundTab",
    variable: "SelectedText",
    hasSelection: false,
  },
] as const

for (const { id, openMode, variable, hasSelection } of pageActionCases) {
  test(`${id}: PageActionショートカット / ${openMode} / {{${variable}}} / ${hasSelection ? "選択あり" : "未選択"}`, async ({
    context,
    extensionId,
    getCommands,
    page,
  }) => {
    const targetUrl = "https://ujiro99.github.io/selection-command/en/test"
    const commandId = "shortcut-page-action"
    const options = new OptionsPage(context, extensionId, getCommands)
    await options.importSettings({
      ...testSettings,
      commands: [
        ...testSettings.commands,
        {
          id: commandId,
          title: "Shortcut PageAction",
          openMode: "pageAction",
          popupOption: { width: 600, height: 700 },
          pageActionOption: {
            startUrl: `${targetUrl}?shortcutPageAction=${id}`,
            openMode,
            steps: [
              {
                id: "start",
                param: { type: "start", label: "Start", url: targetUrl },
              },
              {
                id: "input",
                param: {
                  type: "input",
                  label: "Textarea",
                  selector: "//textarea",
                  selectorType: "xpath",
                  value: `Input: {{${variable}}}`,
                },
              },
              { id: "end", param: { type: "end", label: "End" } },
            ],
          },
        },
      ],
      shortcuts: {
        shortcuts: [
          { id: "slot_1", commandId, noSelectionBehavior: "useClipboard" },
        ],
      },
    })
    await options.close()

    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const testPage = new TestPage(page)
    await testPage.open()
    await page.bringToFront()
    const clipboardText = `clipboard 日本語 & ${id}
    const contexts = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [documentUrl],
    })
[KeyA] {Enter} [] [[ {{`
    await page.evaluate(async (text) => {
      window.getSelection()!.removeAllRanges()
      await navigator.clipboard.writeText(text)
    }, clipboardText)

    let expectedText = clipboardText
    if (hasSelection) {
      await testPage.selectText("h2")
      expectedText = await page.evaluate(() =>
        window.getSelection()!.toString(),
      )
      expect(expectedText).not.toBe("")
      expect(expectedText).not.toBe(clipboardText)
    } else {
      expect(await page.evaluate(() => window.getSelection()!.toString())).toBe(
        "",
      )
    }

    if (openMode === "backgroundTab") {
      await context.serviceWorkers()[0].evaluate(() => {
        const workerGlobal = globalThis as typeof globalThis & {
          createdWindowCount: number
        }
        workerGlobal.createdWindowCount = 0
        chrome.windows.onCreated.addListener(
          () => workerGlobal.createdWindowCount++,
        )
      })
    }

    // Popup mode may first load the clipboard page before the destination.
    const resultPromise = context.waitForEvent("page", {
      predicate: async (candidate) => {
        try {
          await candidate.waitForURL(`${targetUrl}?shortcutPageAction=${id}`)
          return true
        } catch {
          return false
        }
      },
    })
    await runShortcut(context)
    const result = await resultPromise
    await expect(result).toHaveURL(`${targetUrl}?shortcutPageAction=${id}`)
    await expect(result.locator("textarea")).toHaveValue(
      `Input: ${expectedText}`,
      { timeout: 10_000 },
    )

    const resultTab = await context
      .serviceWorkers()[0]
      .evaluate(async (url) => {
        const [tab] = await chrome.tabs.query({ url })
        return {
          active: tab.active,
          windowType: (await chrome.windows.get(tab.windowId)).type,
        }
      }, result.url())
    expect(resultTab.windowType).toBe(openMode === "popup" ? "popup" : "normal")
    if (openMode === "backgroundTab") {
      const createdWindowCount = await context
        .serviceWorkers()[0]
        .evaluate(
          () =>
            (globalThis as typeof globalThis & { createdWindowCount: number })
              .createdWindowCount,
        )
      expect(createdWindowCount).toBe(0)
      expect(resultTab.active).toBe(false)
      expect(await page.evaluate(() => document.hasFocus())).toBe(true)
    }
  })
}
