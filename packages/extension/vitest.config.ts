import { defineConfig, mergeConfig } from "vitest/config"
import { resolve } from "path"
import packageJson from "./package.json"
import rootConfig from "../../vitest.config"

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      setupFiles: ["./src/test/setup.ts"],
    },
    define: {
      __APP_NAME__: JSON.stringify(packageJson.name),
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@import-if": resolve(__dirname, "./src/test/__mocks__/import-if"),
      },
    },
  }),
)
