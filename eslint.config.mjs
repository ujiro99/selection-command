import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist", "pages/.next/**", "coverage/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
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
      // Moderate relaxation for personal development
      "@typescript-eslint/no-explicit-any": "warn", // Type safety is important but can be improved gradually
      "@typescript-eslint/no-unused-vars": "warn", // Dead code cleanup can be postponed
      "@typescript-eslint/no-namespace": "warn", // Legacy code support
      "@typescript-eslint/no-unused-expressions": "warn", // Allow temporary debug code
      "@typescript-eslint/no-require-imports": "warn", // Needed for config files etc
      // Keep as error for safety-critical rules
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "no-prototype-builtins": "error",
      // Style-related rules can be relaxed
      "no-async-promise-executor": "warn", // Temporarily needed for complex async processing
      "no-useless-escape": "warn", // Regex readability
      "prefer-const": "warn", // Code style issue
      // Relaxed rules for personal development
      "@typescript-eslint/no-namespace": "off",
    },
  },
)
