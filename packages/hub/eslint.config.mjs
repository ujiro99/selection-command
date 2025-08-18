import rootConfig from "../../eslint.config.mjs"
import nextPlugin from "@next/eslint-plugin-next"
import tseslint from "typescript-eslint"

export default tseslint.config(
  ...rootConfig,
  {
    ignores: [".next/**", "out/**", "scripts/**", "*.config.*"],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-explicit-any": "off",
      // Disable some strict rules for Next.js app
      "no-redeclare": "off",
      "no-constant-binary-expression": "off",
    },
  },
)
