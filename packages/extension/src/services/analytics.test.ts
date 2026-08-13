import { describe, it, expect } from "vitest"
import {
  ANALYTICS_EVENTS,
  getCommandCreateEvent,
  getHubAddEvent,
  getSelectionCommandEvent,
} from "@/services/analytics"

describe("getCommandCreateEvent", () => {
  it.each([
    ["search", ANALYTICS_EVENTS.COMMAND_CREATE_SEARCH],
    ["aiprompt", ANALYTICS_EVENTS.COMMAND_CREATE_AIPROMPT],
    ["other", ANALYTICS_EVENTS.COMMAND_CREATE_OTHER],
  ] as const)("maps category %s to %s", (category, expected) => {
    expect(getCommandCreateEvent(category)).toBe(expected)
  })
})

describe("getHubAddEvent", () => {
  it.each([
    ["search", ANALYTICS_EVENTS.HUB_ADD_SEARCH],
    ["aiprompt", ANALYTICS_EVENTS.HUB_ADD_AIPROMPT],
    ["other", ANALYTICS_EVENTS.HUB_ADD_OTHER],
  ] as const)("maps category %s to %s", (category, expected) => {
    expect(getHubAddEvent(category)).toBe(expected)
  })
})

describe("getSelectionCommandEvent", () => {
  it.each([
    ["search", ANALYTICS_EVENTS.SELECTION_COMMAND_SEARCH],
    ["aiprompt", ANALYTICS_EVENTS.SELECTION_COMMAND_AIPROMPT],
    ["other", ANALYTICS_EVENTS.SELECTION_COMMAND_OTHER],
  ] as const)("maps category %s to %s", (category, expected) => {
    expect(getSelectionCommandEvent(category)).toBe(expected)
  })
})
