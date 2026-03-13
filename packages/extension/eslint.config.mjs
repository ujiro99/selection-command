import rootConfig from "../../eslint.config.mjs"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(...rootConfig, {
  files: ["**/*.{ts,tsx}"],
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
},
{
  // Playwright fixtures use a `use` callback that conflicts with React hooks rules
  files: ["e2e/**/*.{ts,tsx}"],
  rules: {
    "react-hooks/rules-of-hooks": "off",
  },
})
