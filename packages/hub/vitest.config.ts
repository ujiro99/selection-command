import { defineConfig, mergeConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import rootConfig from "../../vitest.config"

export default mergeConfig(
  rootConfig,
  defineConfig({
    plugins: [react()] as any,
    test: {
      setupFiles: [resolve(__dirname, "./src/test/setup.ts")],
      coverage: {
        exclude: [
          ...(rootConfig.test?.coverage?.exclude || []),
          "next.config.mjs",
          "tailwind.config.ts",
        ],
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@shared": resolve(__dirname, "../shared/src"),
      },
    },
  }),
)
