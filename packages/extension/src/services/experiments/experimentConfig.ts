import { HUB_URL } from "@/const"
import type { ExperimentConfig, ExperimentConfigSource } from "./types"

/** External endpoint serving the experiment allocation config. */
const EXPERIMENTS_URL = `${HUB_URL}/data/experiments.json`

/**
 * Hard timeout for the config fetch. The onboarding tab opens right after
 * this resolves, so a slow hub must never keep the user staring at a blank
 * tab - we fall back to the build-time defaults instead.
 */
const FETCH_TIMEOUT_MS = 3000

/**
 * Build-time defaults, used when the hub is unreachable or returns something
 * unusable. Assignment still happens (rather than forcing everyone to the
 * control), so a hub outage doesn't skew one arm towards users who happened
 * to have connectivity problems at install time.
 *
 * These intentionally duplicate packages/hub/public/data/experiments.json:
 * that file is the live control plane, this is the offline safety net. When
 * the hub-side ratio is changed for good (as opposed to a temporary tweak),
 * update these values too, or the fallback path keeps using the old split.
 */
export const DEFAULT_CONFIGS: Record<string, ExperimentConfig> = {
  onboarding_v2: { enabled: true, allocation: 0.5 },
}

const DEFAULT_CONFIG: ExperimentConfig = { enabled: false, allocation: 0 }

export const getDefaultConfig = (experimentId: string): ExperimentConfig =>
  DEFAULT_CONFIGS[experimentId] ?? DEFAULT_CONFIG

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/**
 * Coerce one entry of the remote JSON into a usable config, falling back
 * field by field so a partially broken payload still yields safe values.
 */
export const normalizeConfig = (
  raw: unknown,
  experimentId: string,
): ExperimentConfig => {
  const fallback = getDefaultConfig(experimentId)
  if (raw == null || typeof raw !== "object") return fallback

  const { enabled, allocation } = raw as Partial<ExperimentConfig>
  return {
    enabled: typeof enabled === "boolean" ? enabled : fallback.enabled,
    allocation:
      typeof allocation === "number" && Number.isFinite(allocation)
        ? clamp01(allocation)
        : fallback.allocation,
  }
}

export type FetchedConfig = {
  config: ExperimentConfig
  source: ExperimentConfigSource
}

/**
 * Fetch the allocation config for a single experiment.
 * Deliberately uncached: an experiment assignment happens once per install,
 * so there is nothing to amortize, and the ratio must be changeable from the
 * hub without waiting for a cache to expire.
 */
export const fetchExperimentConfig = async (
  experimentId: string,
): Promise<FetchedConfig> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(EXPERIMENTS_URL, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(
        `Failed to fetch experiments from ${EXPERIMENTS_URL}: HTTP ${res.status}`,
      )
    }
    const raw = await res.json()
    if (raw == null || typeof raw !== "object") {
      throw new Error(`Unexpected experiments response from ${EXPERIMENTS_URL}`)
    }
    const entry = (raw as Record<string, unknown>)[experimentId]
    if (entry === undefined) {
      // The experiment was removed from the config: treat it as finished.
      return { config: { enabled: false, allocation: 0 }, source: "remote" }
    }
    return { config: normalizeConfig(entry, experimentId), source: "remote" }
  } catch (error) {
    console.warn("Failed to fetch experiment config:", error)
    return { config: getDefaultConfig(experimentId), source: "fallback" }
  } finally {
    clearTimeout(timer)
  }
}
