import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  normalizeConfig,
  getDefaultConfig,
  fetchExperimentConfig,
} from "./experimentConfig"

const EXPERIMENT_ID = "onboarding_v2"

const mockFetchOnce = (body: unknown, ok = true, status = 200) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    }),
  )
}

describe("normalizeConfig", () => {
  it("keeps a well-formed config as-is", () => {
    expect(
      normalizeConfig({ enabled: true, allocation: 0.3 }, EXPERIMENT_ID),
    ).toEqual({ enabled: true, allocation: 0.3 })
  })

  it("clamps an out-of-range allocation into 0..1", () => {
    expect(
      normalizeConfig({ enabled: true, allocation: 3 }, EXPERIMENT_ID),
    ).toEqual({ enabled: true, allocation: 1 })
    expect(
      normalizeConfig({ enabled: true, allocation: -1 }, EXPERIMENT_ID),
    ).toEqual({ enabled: true, allocation: 0 })
  })

  it("falls back field by field for a malformed payload", () => {
    const fallback = getDefaultConfig(EXPERIMENT_ID)
    expect(
      normalizeConfig({ enabled: "yes", allocation: "half" }, EXPERIMENT_ID),
    ).toEqual(fallback)
    expect(normalizeConfig(null, EXPERIMENT_ID)).toEqual(fallback)
  })
})

describe("fetchExperimentConfig", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("returns the remote config for the requested experiment", async () => {
    mockFetchOnce({ [EXPERIMENT_ID]: { enabled: true, allocation: 0.25 } })

    await expect(fetchExperimentConfig(EXPERIMENT_ID)).resolves.toEqual({
      config: { enabled: true, allocation: 0.25 },
      source: "remote",
    })
  })

  it("treats a removed experiment as finished", async () => {
    mockFetchOnce({ other_experiment: { enabled: true, allocation: 1 } })

    await expect(fetchExperimentConfig(EXPERIMENT_ID)).resolves.toEqual({
      config: { enabled: false, allocation: 0 },
      source: "remote",
    })
  })

  it("falls back to the build-time config on an HTTP error", async () => {
    mockFetchOnce({}, false, 503)

    await expect(fetchExperimentConfig(EXPERIMENT_ID)).resolves.toEqual({
      config: getDefaultConfig(EXPERIMENT_ID),
      source: "fallback",
    })
  })

  it("falls back to the build-time config when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

    await expect(fetchExperimentConfig(EXPERIMENT_ID)).resolves.toEqual({
      config: getDefaultConfig(EXPERIMENT_ID),
      source: "fallback",
    })
  })
})
