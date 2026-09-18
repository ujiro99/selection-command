import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import { fetchExperimentConfig } from "./experimentConfig"
import type {
  ExperimentAssignment,
  ExperimentVariant,
  Experiments,
} from "./types"

/** Experiment id reported to GA4 as `experiment_id`. */
export const ONBOARDING_EXPERIMENT_ID = "onboarding_v2"

/**
 * Last resolved assignment, kept in module memory so analytics helpers can
 * read the variant synchronously (chrome.storage is async, and the event
 * wrapper must not become async for every caller).
 */
let cachedAssignment: ExperimentAssignment | null = null

export const getOnboardingAssignmentSync = (): ExperimentAssignment | null =>
  cachedAssignment

export const getOnboardingVariantSync = (): ExperimentVariant | null =>
  cachedAssignment?.variant ?? null

/**
 * dev/e2e only: force a variant for the rest of this page's lifetime without
 * fetching or persisting anything, so `?variant=B` can be used to review a
 * screen directly. See useOnboardingVariant().
 */
export const overrideOnboardingAssignment = (
  variant: ExperimentVariant,
): ExperimentAssignment => {
  cachedAssignment = {
    variant,
    allocation: variant === "B" ? 1 : 0,
    configSource: "fallback",
    assignedAt: Date.now(),
  }
  return cachedAssignment
}

/** Test-only: drop the in-memory cache between cases. */
export const resetOnboardingAssignmentCache = () => {
  cachedAssignment = null
}

const readAssignment = async (): Promise<ExperimentAssignment | null> => {
  const experiments = await Storage.get<Experiments>(
    LOCAL_STORAGE_KEY.EXPERIMENTS,
  )
  return experiments?.[ONBOARDING_EXPERIMENT_ID] ?? null
}

/**
 * Resolve this user's onboarding variant, assigning (and persisting) one on
 * first call. Normally called from the background script's onInstalled
 * handler before the onboarding tab is opened, so the page itself only has
 * to read the stored value; calling it again is a no-op that returns the
 * same assignment, which keeps every onboarding_* event of a given user on
 * one variant even if the page is reopened.
 */
export const ensureOnboardingAssignment =
  async (): Promise<ExperimentAssignment> => {
    const existing = await readAssignment()
    if (existing) {
      cachedAssignment = existing
      return existing
    }

    const { config, source } = await fetchExperimentConfig(
      ONBOARDING_EXPERIMENT_ID,
    )
    const variant: ExperimentVariant =
      config.enabled && Math.random() < config.allocation ? "B" : "A"
    const assignment: ExperimentAssignment = {
      variant,
      allocation: config.allocation,
      configSource: source,
      assignedAt: Date.now(),
    }

    // Re-read inside the update so an assignment that landed while the
    // config was being fetched is kept instead of being overwritten with a
    // second coin flip. Storage.update is a plain get/set with no locking,
    // so this is best-effort rather than atomic: two contexts assigning at
    // the exact same moment can still race. The install flow awaits this
    // before opening the onboarding tab, so that window is not reachable
    // in practice.
    let stored = assignment
    await Storage.update<Experiments>(LOCAL_STORAGE_KEY.EXPERIMENTS, (cur) => {
      const current = cur?.[ONBOARDING_EXPERIMENT_ID]
      if (current) {
        stored = current
        return cur
      }
      return { ...cur, [ONBOARDING_EXPERIMENT_ID]: assignment }
    })

    cachedAssignment = stored
    return stored
  }
