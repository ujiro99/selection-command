import { useCallback, useState } from "react"
import { SelectContextProvider } from "@/providers/SelectContextProvider"
import { SelectAnchor } from "@/components/SelectAnchor"
import { Popup } from "@/components/Popup"
import { LinkSelector } from "@/components/LinkSelector"
import { useOnboardingState } from "./useOnboardingState"
import { useOnboardingVariant } from "./useOnboardingVariant"
import { OnboardingLayout } from "./OnboardingLayout"
import { OnboardingWelcome } from "./OnboardingWelcome"
import { StepIntro } from "./steps/StepIntro"
import { StepSearchCommand } from "./steps/StepSearchCommand"
import { StepAiPromptCommand } from "./steps/StepAiPromptCommand"
import { StepLinkPreview } from "./steps/StepLinkPreview"
import { StepCustomize } from "./steps/StepCustomize"
import { StepComplete } from "./steps/StepComplete"
import { OnboardingStep, StepPhase } from "@/types/onboarding"
import type { ExperimentVariant } from "@/services/experiments"

import "@/components/App.css"

export function OnboardingPage() {
  const variant = useOnboardingVariant()

  // Hold a blank canvas until the A/B assignment is known (normally a single
  // chrome.storage.local read, since the background script assigns on
  // install). Rendering a default arm first would flash variant A's INTRO
  // screen at variant B users.
  if (variant == null) {
    return <div className="min-h-screen bg-white" />
  }
  return <OnboardingFlow variant={variant} />
}

function OnboardingFlow({ variant }: { variant: ExperimentVariant }) {
  const onboarding = useOnboardingState(variant)
  const [positionElm, setPositionElm] = useState<Element | null>(null)

  // Variant B opens on a welcome overlay instead of the INTRO step. The step
  // below it stays unmounted meanwhile, so its own entrance animations start
  // only once the greeting is out of the way.
  const isWelcome = onboarding.phase === StepPhase.WELCOME
  const { setPhase } = onboarding
  const goToExplain = useCallback(() => setPhase(StepPhase.EXPLAIN), [setPhase])

  return (
    <SelectContextProvider>
      <OnboardingLayout
        step={onboarding.step}
        phase={onboarding.phase}
        onSkip={onboarding.skip}
      >
        {!isWelcome && (
          <>
            {onboarding.step === OnboardingStep.INTRO && (
              <StepIntro onboarding={onboarding} />
            )}
            {onboarding.step === OnboardingStep.SEARCH && (
              <StepSearchCommand onboarding={onboarding} />
            )}
            {onboarding.step === OnboardingStep.AI_PROMPT && (
              <StepAiPromptCommand onboarding={onboarding} />
            )}
            {onboarding.step === OnboardingStep.LINK_PREVIEW && (
              <StepLinkPreview onboarding={onboarding} />
            )}
            {onboarding.step === OnboardingStep.CUSTOMIZE && (
              <StepCustomize onboarding={onboarding} />
            )}
            {onboarding.step === OnboardingStep.COMPLETE && (
              <StepComplete onboarding={onboarding} />
            )}
          </>
        )}
      </OnboardingLayout>

      {isWelcome && <OnboardingWelcome onDone={goToExplain} />}

      <SelectAnchor ref={setPositionElm} />
      <Popup positionElm={positionElm} inOnboarding={true} />
      <LinkSelector />
    </SelectContextProvider>
  )
}
