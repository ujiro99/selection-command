// ms, nested by phase since the same element (e.g. rail) can have a
// different delay depending on which phase is currently showing it. Shared
// across the onboarding step components (StepSearchCommand, StepAiPromptCommand,
// StepLinkPreview) - each step's own `delays` object only fills in the keys
// it actually renders for a given phase.
export type PhaseDelays = {
  commandType: number
  message: number
  rail: number
  targetText?: number
  targetTextCallout?: number
  callout?: number
  returnCallout?: number
  emoji?: number
  valueSubmessage?: number
  nextButton?: number
}
