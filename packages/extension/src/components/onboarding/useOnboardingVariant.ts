import { useEffect, useState } from "react"
import {
  ensureOnboardingAssignment,
  overrideOnboardingAssignment,
} from "@/services/experiments"
import type { ExperimentVariant } from "@/services/experiments"

// development or e2e build-only escape hatch (`?variant=B`), mirroring
// useOnboardingState's `?step=/?phase=` override so screenshot and manual QA
// tooling can land on either arm of the experiment on demand.
function readVariantOverride(): ExperimentVariant | null {
  if (!["e2e", "development"].includes(import.meta.env.MODE)) return null
  const param = new URLSearchParams(window.location.search).get("variant")
  if (param !== "A" && param !== "B") return null
  return overrideOnboardingAssignment(param).variant
}

/**
 * Resolve which onboarding variant to render, returning null until it is
 * known. The background script assigns the variant on install before opening
 * this tab (see background_script.ts), so this is normally just a single
 * chrome.storage.local read; the fetch path only runs if that assignment is
 * missing (page reopened manually, or the install-time assignment failed).
 */
export function useOnboardingVariant(): ExperimentVariant | null {
  const [variant, setVariant] = useState<ExperimentVariant | null>(
    readVariantOverride,
  )

  useEffect(() => {
    if (variant != null) return
    let cancelled = false
    ensureOnboardingAssignment()
      .then((assignment) => {
        if (!cancelled) setVariant(assignment.variant)
      })
      .catch((error) => {
        console.error("Failed to resolve onboarding variant:", error)
        // Never leave the user on a blank tab: fall back to the control.
        if (!cancelled) setVariant("A")
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return variant
}
