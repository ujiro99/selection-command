import {
  HoverCardError,
  type HoverCardAttempt,
  type HoverCardBackend,
  type HoverCardContext,
  type HoverCardErrorKind,
} from "./types"

export type FallbackResult<O> = {
  output: O
  backendId: string
  attempts: HoverCardAttempt[]
}

// When every backend fails, report the error the user can act on first.
const ERROR_PRIORITY: HoverCardErrorKind[] = [
  "notApplicable",
  "needsActivation",
  "unsupported",
  "failed",
  "unavailable",
]

const toKind = (e: unknown): HoverCardErrorKind =>
  e instanceof HoverCardError ? e.kind : "failed"

const isAbort = (e: unknown): boolean =>
  e instanceof DOMException && e.name === "AbortError"

/**
 * Run backends in order and return the first successful result.
 * "notApplicable" stops the chain, since another backend would not change it.
 */
export async function runWithFallback<I, O>(
  backends: HoverCardBackend<I, O>[],
  input: I,
  opts: { signal: AbortSignal; ctx: HoverCardContext },
): Promise<FallbackResult<O>> {
  const attempts: HoverCardAttempt[] = []
  const errors: HoverCardError[] = []

  for (const backend of backends) {
    opts.signal.throwIfAborted()

    if (!(await backend.isAvailable(opts.ctx))) {
      attempts.push({ backendId: backend.id, outcome: "skipped" })
      continue
    }

    try {
      const output = await backend.run(input, opts)
      attempts.push({ backendId: backend.id, outcome: "succeeded" })
      return { output, backendId: backend.id, attempts }
    } catch (e) {
      if (isAbort(e)) throw e
      const kind = toKind(e)
      attempts.push({ backendId: backend.id, outcome: "failed", error: kind })
      errors.push(
        e instanceof HoverCardError
          ? e
          : new HoverCardError("failed", String(e), { cause: e }),
      )
      if (kind === "notApplicable") break
    }
  }

  const error =
    ERROR_PRIORITY.map((k) => errors.find((e) => e.kind === k)).find(
      (e) => e != null,
    ) ?? new HoverCardError("unavailable", "No backend is available")
  throw Object.assign(error, { attempts })
}
