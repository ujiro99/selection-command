import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Storage, LOCAL_STORAGE_KEY } from "@/services/storage"
import { setupStorageMocks } from "@/test/setup"
import type { Experiments } from "./types"

const fetchExperimentConfig = vi.fn()
vi.mock("./experimentConfig", async () => {
  const actual =
    await vi.importActual<typeof import("./experimentConfig")>(
      "./experimentConfig",
    )
  return {
    ...actual,
    fetchExperimentConfig: (...args: unknown[]) =>
      fetchExperimentConfig(...args),
  }
})

const {
  ensureOnboardingAssignment,
  getOnboardingVariantSync,
  resetOnboardingAssignmentCache,
  ONBOARDING_EXPERIMENT_ID,
} = await import("./onboardingExperiment")

const readStored = () => Storage.get<Experiments>(LOCAL_STORAGE_KEY.EXPERIMENTS)

describe("ensureOnboardingAssignment", () => {
  beforeEach(async () => {
    setupStorageMocks("realistic")
    resetOnboardingAssignmentCache()
    fetchExperimentConfig.mockReset()
    await Storage.set<Experiments>(LOCAL_STORAGE_KEY.EXPERIMENTS, {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("assigns variant B when the random draw lands below the allocation", async () => {
    fetchExperimentConfig.mockResolvedValue({
      config: { enabled: true, allocation: 0.5 },
      source: "remote",
    })
    vi.spyOn(Math, "random").mockReturnValue(0.49)

    const assignment = await ensureOnboardingAssignment()

    expect(assignment.variant).toBe("B")
    expect(assignment.configSource).toBe("remote")
    expect(getOnboardingVariantSync()).toBe("B")
    expect((await readStored())[ONBOARDING_EXPERIMENT_ID].variant).toBe("B")
  })

  it("assigns the control when the draw lands above the allocation", async () => {
    fetchExperimentConfig.mockResolvedValue({
      config: { enabled: true, allocation: 0.5 },
      source: "remote",
    })
    vi.spyOn(Math, "random").mockReturnValue(0.5)

    expect((await ensureOnboardingAssignment()).variant).toBe("A")
  })

  it("assigns everyone to the control while the experiment is disabled", async () => {
    fetchExperimentConfig.mockResolvedValue({
      config: { enabled: false, allocation: 1 },
      source: "remote",
    })
    vi.spyOn(Math, "random").mockReturnValue(0)

    expect((await ensureOnboardingAssignment()).variant).toBe("A")
  })

  it("still assigns randomly when the config could not be fetched", async () => {
    fetchExperimentConfig.mockResolvedValue({
      config: { enabled: true, allocation: 0.5 },
      source: "fallback",
    })
    vi.spyOn(Math, "random").mockReturnValue(0.1)

    const assignment = await ensureOnboardingAssignment()

    expect(assignment.variant).toBe("B")
    expect(assignment.configSource).toBe("fallback")
  })

  it("reuses a stored assignment instead of drawing again", async () => {
    fetchExperimentConfig.mockResolvedValue({
      config: { enabled: true, allocation: 1 },
      source: "remote",
    })
    await Storage.set<Experiments>(LOCAL_STORAGE_KEY.EXPERIMENTS, {
      [ONBOARDING_EXPERIMENT_ID]: {
        variant: "A",
        allocation: 0.5,
        configSource: "remote",
        assignedAt: 1,
      },
    })

    const assignment = await ensureOnboardingAssignment()

    expect(assignment.variant).toBe("A")
    expect(assignment.assignedAt).toBe(1)
    expect(fetchExperimentConfig).not.toHaveBeenCalled()
  })

  it("keeps other experiments' assignments when persisting a new one", async () => {
    fetchExperimentConfig.mockResolvedValue({
      config: { enabled: true, allocation: 1 },
      source: "remote",
    })
    await Storage.set<Experiments>(LOCAL_STORAGE_KEY.EXPERIMENTS, {
      other_experiment: {
        variant: "B",
        allocation: 1,
        configSource: "remote",
        assignedAt: 1,
      },
    })

    await ensureOnboardingAssignment()

    const stored = await readStored()
    expect(stored.other_experiment.variant).toBe("B")
    expect(stored[ONBOARDING_EXPERIMENT_ID].variant).toBe("B")
  })
})
