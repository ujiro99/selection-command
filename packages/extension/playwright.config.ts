import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  // Extension tests use launchPersistentContext, which can conflict when run in parallel.
  workers: 1,
})
