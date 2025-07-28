import { defineMacroProvider, defineMacro } from "vite-plugin-macro"

export function provideImportIf({ mode }: { mode: string }) {
  const importIfMacro = defineMacro("importIf")
    .withSignature("(targetMode: string, path: string)")
    .withHandler(({ path, args }, { template }) => {
      if (!path.parentPath.isExpressionStatement()) {
        throw new Error(
          "importIf macro can only be used at the top level (standalone line).",
        )
      }

      const targetMode = args[0]
      const importPath = args[1]

      if (!targetMode.isStringLiteral() || !importPath.isStringLiteral()) {
        throw new Error("Literal string only")
      }

      // Generate import only when mode matches the specified targetMode
      if (mode === targetMode.node.value) {
        path.parentPath.replaceWith(
          template.statement.ast(`import "${importPath.node.value}"`),
        )
      } else {
        // Remove statement when condition doesn't match
        path.parentPath.remove()
      }
    })

  return defineMacroProvider({
    id: "import-if",
    exports: {
      "@import-if": { macros: [importIfMacro] },
    },
  })
}
