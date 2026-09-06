import { OPEN_MODE, POPUP_OPTION } from "@/const"
import { INSERT, toInsertTemplate } from "@/services/pageAction/insertSymbols"
import type { AiPromptCommand } from "@/types"

const SELECTED_TEXT = toInsertTemplate(INSERT.SELECTED_TEXT)

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

// Per-locale title/prompt text for the onboarding AiPrompt command, keyed the
// same way as defaultSettings.ts's LOCALE_COMMANDS (exact BCP 47 keys such as
// "pt-br" take priority there over prefix keys such "pt" - both are listed
// here since their text happens to be identical today but may diverge).
type OnboardingAiPromptLocaleText = {
  title: string
  prompt: string
}

const ONBOARDING_AI_PROMPT_LOCALES: Record<
  string,
  OnboardingAiPromptLocaleText
> = {
  en: {
    title: "Run with AI",
    prompt: `Please execute the following prompt.\n\n${SELECTED_TEXT}`,
  },
  ja: {
    title: "AIで実行",
    prompt: `以下のプロンプトを実行してください。\n\n${SELECTED_TEXT}`,
  },
  zh: {
    title: "用AI执行",
    prompt: `请执行以下提示词。\n\n${SELECTED_TEXT}`,
  },
  ko: {
    title: "AI로 실행",
    prompt: `다음 프롬프트를 실행해 주세요.\n\n${SELECTED_TEXT}`,
  },
  ru: {
    title: "Выполнить с ИИ",
    prompt: `Пожалуйста, выполните следующий запрос.\n\n${SELECTED_TEXT}`,
  },
  de: {
    title: "Mit KI ausführen",
    prompt: `Bitte führen Sie den folgenden Prompt aus.\n\n${SELECTED_TEXT}`,
  },
  fr: {
    title: "Exécuter avec l'IA",
    prompt: `Veuillez exécuter le prompt suivant.\n\n${SELECTED_TEXT}`,
  },
  es: {
    title: "Ejecutar con IA",
    prompt: `Por favor, ejecuta el siguiente prompt.\n\n${SELECTED_TEXT}`,
  },
  "pt-br": {
    title: "Executar com IA",
    prompt: `Por favor, execute o seguinte prompt.\n\n${SELECTED_TEXT}`,
  },
  pt: {
    title: "Executar com IA",
    prompt: `Por favor, execute o seguinte prompt.\n\n${SELECTED_TEXT}`,
  },
  hi: {
    title: "AI से चलाएं",
    prompt: `कृपया निम्नलिखित प्रॉम्प्ट को निष्पादित करें।\n\n${SELECTED_TEXT}`,
  },
  id: {
    title: "Jalankan dengan AI",
    prompt: `Silakan jalankan prompt berikut.\n\n${SELECTED_TEXT}`,
  },
  ms: {
    title: "Jalankan dengan AI",
    prompt: `Sila jalankan gesaan berikut.\n\n${SELECTED_TEXT}`,
  },
  it: {
    title: "Esegui con l'IA",
    prompt: `Esegui il seguente prompt.\n\n${SELECTED_TEXT}`,
  },
}

// Builds the onboarding AiPrompt command for every supported locale, keyed
// the same way as ONBOARDING_AI_PROMPT_LOCALES / defaultSettings.ts's
// LOCALE_COMMANDS. `iconUrl` is passed in rather than resolved here since
// it comes from ai-services.json (an AI-service concern, not onboarding).
export function createOnboardingAiPromptCommands(
  iconUrl: string,
): Record<string, AiPromptCommand> {
  return Object.fromEntries(
    Object.entries(ONBOARDING_AI_PROMPT_LOCALES).map(
      ([locale, { title, prompt }]) => [
        locale,
        createOnboardingAiPromptCommand(title, prompt, iconUrl),
      ],
    ),
  )
}
