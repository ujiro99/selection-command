import { useState } from "react"
import { SelectContextProvider } from "@/providers/SelectContextProvider"
import { SelectAnchor } from "@/components/SelectAnchor"
import { Popup } from "@/components/Popup"
import { LinkSelector } from "@/components/LinkSelector"
import { useOnboardingState } from "./useOnboardingState"
import { OnboardingLayout } from "./OnboardingLayout"
import { StepIntro } from "./steps/StepIntro"
import { StepSearchCommand } from "./steps/StepSearchCommand"
import { StepAiPromptCommand } from "./steps/StepAiPromptCommand"
import { StepLinkPreview } from "./steps/StepLinkPreview"
import { StepCustomize } from "./steps/StepCustomize"
import { StepComplete } from "./steps/StepComplete"
import { OnboardingStep } from "@/types/onboarding"

import "@/components/App.css"

export function OnboardingPage() {
  const onboarding = useOnboardingState()
  const [positionElm, setPositionElm] = useState<Element | null>(null)
  const [isHover, setIsHover] = useState(false)

  return (
    <SelectContextProvider isPopupHover={isHover}>
      <OnboardingLayout step={onboarding.step} onSkip={onboarding.skip}>
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
      </OnboardingLayout>

      <SelectAnchor ref={setPositionElm} />
      <Popup positionElm={positionElm} onHover={setIsHover} />
      <LinkSelector />
    </SelectContextProvider>
  )
}
