export enum OnboardingStep {
  INTRO = 0,
  SEARCH = 1,
  AI_PROMPT = 2,
  LINK_PREVIEW = 3,
  CUSTOMIZE = 4,
  COMPLETE = 5,
}

// Sub-state within a single step: shown its explanation, waiting for the
// user to select text, waiting for them to run the command, waiting for
// them to come back from the popup/tab it opened, then showing the value
// message. Not every step uses every phase (e.g. INTRO/CUSTOMIZE/COMPLETE
// only ever use EXPLAIN, and WELCOME only ever precedes SEARCH's EXPLAIN in
// variant B).
export enum StepPhase {
  // Variant B only: the welcome overlay shown before the first step's
  // explanation (variant A shows the INTRO step instead).
  WELCOME = "welcome",
  EXPLAIN = "explain",
  WAIT_SELECTION = "wait_selection",
  WAIT_EXECUTE = "wait_execute",
  WAIT_RETURN = "wait_return",
  VALUE_SHOWN = "value_shown",
}
