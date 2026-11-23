import { describe, it, expect, vi } from "vitest"
import { runWithFallback } from "../runWithFallback"
import { HoverCardError, type HoverCardBackend } from "../types"

const ctx = { uiLanguage: "ja" }

function backend(
  id: string,
  impl: {
    available?: boolean
    run?: () => Promise<string>
  },
): HoverCardBackend<string, string> {
  return {
    id,
    isAvailable: vi.fn(async () => impl.available ?? true),
    run: vi.fn(impl.run ?? (async () => `${id}-result`)),
  }
}

const opts = () => ({ signal: new AbortController().signal, ctx })

describe("runWithFallback", () => {
  it("HC-01: returns the first successful backend result", async () => {
    const a = backend("a", {})
    const b = backend("b", {})

    const res = await runWithFallback([a, b], "text", opts())

    expect(res.output).toBe("a-result")
    expect(res.backendId).toBe("a")
    expect(b.run).not.toHaveBeenCalled()
  })

  it("HC-02: skips unavailable backends", async () => {
    const a = backend("a", { available: false })
    const b = backend("b", {})

    const res = await runWithFallback([a, b], "text", opts())

    expect(res.backendId).toBe("b")
    expect(a.run).not.toHaveBeenCalled()
    expect(res.attempts).toEqual([
      { backendId: "a", outcome: "skipped" },
      { backendId: "b", outcome: "succeeded" },
    ])
  })

  it("HC-03: falls back to the next backend when one fails", async () => {
    const a = backend("a", {
      run: async () => {
        throw new HoverCardError("unsupported")
      },
    })
    const b = backend("b", {})

    const res = await runWithFallback([a, b], "text", opts())

    expect(res.backendId).toBe("b")
    expect(res.attempts[0]).toEqual({
      backendId: "a",
      outcome: "failed",
      error: "unsupported",
    })
  })

  it("HC-04: stops the chain on notApplicable", async () => {
    const a = backend("a", {
      run: async () => {
        throw new HoverCardError("notApplicable")
      },
    })
    const b = backend("b", {})

    await expect(runWithFallback([a, b], "text", opts())).rejects.toMatchObject(
      { kind: "notApplicable" },
    )
    expect(b.run).not.toHaveBeenCalled()
  })

  it("HC-05: reports needsActivation over other errors when all fail", async () => {
    const a = backend("a", {
      run: async () => {
        throw new Error("boom")
      },
    })
    const b = backend("b", {
      run: async () => {
        throw new HoverCardError("needsActivation")
      },
    })

    await expect(runWithFallback([a, b], "text", opts())).rejects.toMatchObject(
      { kind: "needsActivation" },
    )
  })

  it("HC-06: reports unavailable when no backend is available", async () => {
    const a = backend("a", { available: false })

    await expect(runWithFallback([a], "text", opts())).rejects.toMatchObject({
      kind: "unavailable",
    })
  })

  it("HC-07: rethrows abort without trying other backends", async () => {
    const ac = new AbortController()
    const a = backend("a", {
      run: async () => {
        ac.abort()
        throw new DOMException("aborted", "AbortError")
      },
    })
    const b = backend("b", {})

    await expect(
      runWithFallback([a, b], "text", { signal: ac.signal, ctx }),
    ).rejects.toMatchObject({ name: "AbortError" })
    expect(b.run).not.toHaveBeenCalled()
  })
})
