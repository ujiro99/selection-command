import fs from "fs"
import path from "path"
import { defineConfig } from "vite"
import packageJson from "../package.json"

// Minimal vite config for scripts run via vite-node.
// Only includes alias resolution and define — no browser plugins.
export default defineConfig({
  define: {
    __APP_NAME__: JSON.stringify(packageJson.name),
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __AI_SERVICES_JSON__: fs.readFileSync(
      path.resolve(__dirname, "../../hub/public/data/ai-services.json"),
      "utf-8",
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
      "@shared": path.resolve(__dirname, "../../shared/src"),
    },
  },
})
