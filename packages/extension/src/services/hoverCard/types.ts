import type React from "react"
import type { HoverCardProviderId } from "@/types"

/**
 * Reasons a hover card could not produce a result.
 * - unavailable: the backend cannot run in this environment.
 * - unsupported: the input (e.g. language pair) is not supported.
 * - needsActivation: a user gesture (click) is required, e.g. for a model download.
 * - notApplicable: nothing to show (e.g. text is already in the user's language).
 * - failed: unexpected error.
 */
export type HoverCardErrorKind =
  "unavailable" | "unsupported" | "needsActivation" | "notApplicable" | "failed"

export class HoverCardError extends Error {
  constructor(
    readonly kind: HoverCardErrorKind,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? kind, options)
    this.name = "HoverCardError"
  }
}

export type HoverCardContext = {
  /** User's language as a BCP 47 tag (e.g. "ja", "en-US"). */
  uiLanguage: string
  /** Reports model download progress as a fraction between 0 and 1. */
  onProgress?: (fraction: number) => void
}

/** One concrete way to obtain a result (e.g. on-device API, web API). */
export interface HoverCardBackend<I, O> {
  id: string
  /** Cheap check whether the backend can run at all in this environment. */
  isAvailable(ctx: HoverCardContext): Promise<boolean>
  run(
    input: I,
    opts: { signal: AbortSignal; ctx: HoverCardContext },
  ): Promise<O>
}

/** Metadata passed to the renderer along with the result. */
export type HoverCardResultMeta = {
  backendId: string
}

/** One feature shown in a hover card (translate, currency, ...). */
export interface HoverCardProvider<I, O> {
  id: HoverCardProviderId
  /** "hover": fetch after a hover delay. "immediate": fetch when the menu opens. */
  trigger: "hover" | "immediate"
  /** Parse the selection. Returns null when the selection is not applicable. */
  match(selectionText: string, ctx: HoverCardContext): I | null
  /** Backends tried in order until one succeeds. */
  backends: HoverCardBackend<I, O>[]
  cacheKey(input: I, ctx: HoverCardContext): string
  render(output: O, meta: HoverCardResultMeta): React.ReactNode
}

export type HoverCardAttempt = {
  backendId: string
  outcome: "skipped" | "failed" | "succeeded"
  error?: HoverCardErrorKind
}
