/**
 * Variant a user is assigned to for an A/B test.
 * Each letter names one UI pattern and keeps meaning that pattern across
 * experiments, so a GA4 `variant` value never means two different patterns.
 * Retired letters are never reused: "A" was the original INTRO flow, "B" was
 * onboarding_v2's treatment, and "D" was onboarding_v4's treatment (C
 * without the step rail and with the welcome glow as the page background).
 *
 * Live letters: "C" is the welcome-overlay flow, "E" is D with the step rail
 * restored. Which letter is the control is decided per experiment:
 * onboarding_v5 compares C (control) with E.
 */
export type ExperimentVariant = "C" | "E"

/** Remote configuration of a single experiment, served by the hub. */
export type ExperimentConfig = {
  /** Kill switch: when false, everyone is assigned to the control. */
  enabled: boolean
  /** Ratio of users assigned to the treatment variant, clamped to 0..1. */
  allocation: number
}

/**
 * Whether the config that drove an assignment came from the hub or from the
 * build-time defaults (hub unreachable / malformed response). Reported to
 * analytics so a failure spike can be separated out during analysis.
 */
export type ExperimentConfigSource = "remote" | "fallback"

/** A user's assignment for one experiment, persisted in chrome.storage.local. */
export type ExperimentAssignment = {
  variant: ExperimentVariant
  /** The allocation in effect when the assignment was made. */
  allocation: number
  configSource: ExperimentConfigSource
  /** Unix ms, for debugging and for expiring stale experiments later. */
  assignedAt: number
}

/** Shape of the LOCAL_STORAGE_KEY.EXPERIMENTS record, keyed by experiment id. */
export type Experiments = Record<string, ExperimentAssignment>
