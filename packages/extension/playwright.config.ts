import dotenv from "dotenv"
import { defineConfig } from "@playwright/test"

dotenv.config({ path: ".env.e2e" })

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  // Extension tests use launchPersistentContext, which can conflict when run in parallel.
  workers: 1,
  outputDir: "test-results",
  use: {
    screenshot: "only-on-failure",
  },
})
