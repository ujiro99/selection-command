/**
 * Variant a user is assigned to for an A/B test.
 * "A" is always the control (the behavior that shipped before the test).
 */
export type ExperimentVariant = "A" | "B"

/** Remote configuration of a single experiment, served by the hub. */
export type ExperimentConfig = {
  /** Kill switch: when false, everyone is assigned to the control. */
  enabled: boolean
  /** Ratio of users assigned to variant B, clamped to 0..1. */
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
