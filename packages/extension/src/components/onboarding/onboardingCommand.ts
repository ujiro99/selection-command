import { OPEN_MODE, POPUP_OPTION } from "@/const"
import type { AiPromptCommand } from "@/types"

// Fixed id for the onboarding's AiPrompt command, so the onboarding UI can
// reliably point a callout at this specific menu button
// (see MenuItem.tsx's `data-command-id` attribute) regardless of locale.
export const ONBOARDING_AI_PROMPT_COMMAND_ID =
  "8b6f2e10-9a44-5c7d-8b3f-2e6a7c1d4f90"

// Creates the AiPrompt command used in Step2 of the onboarding. It is added
// as a normal, permanent default command (not removed after onboarding
// finishes) so returning users can keep using it. The prompt simply forwards
// the selected text, so users can see their selection reflected back
// immediately without needing to understand prompt engineering.
export function createOnboardingAiPromptCommand(
  title: string,
  prompt: string,
  iconUrl: string,
): AiPromptCommand {
  return {
    id: ONBOARDING_AI_PROMPT_COMMAND_ID,
    revision: 0,
    title,
    iconUrl,
    openMode: OPEN_MODE.AI_PROMPT,
    aiPromptOption: {
      serviceId: "gemini",
      prompt,
      openMode: OPEN_MODE.SIDE_PANEL,
    },
    popupOption: {
      width: POPUP_OPTION.width,
      height: POPUP_OPTION.height,
    },
  }
}
