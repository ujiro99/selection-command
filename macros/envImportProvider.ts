import { defineMacroProvider, defineMacro } from "vite-plugin-macro"

export function provideEnvImport({ mode }: { mode: string }) {
  const envImportMacro = defineMacro("envImport")
    .withSignature("(prodPath: string, devPath: string)")
    .withHandler(({ path, args }, { template }) => {
      if (!path.parentPath.isExpressionStatement()) {
        throw new Error(
          "envImportマクロはトップレベル（単独行）でのみ使用してください。",
        )
      }
      // mode判定に切り替え
      const chosen = mode === "production" ? args[0] : args[1]
      if (!chosen.isStringLiteral()) throw new Error("Literal string only")
      path.parentPath.replaceWith(
        template.statement.ast(`import "${chosen.node.value}"`),
      )
    })

  return defineMacroProvider({
    id: "env-import",
    exports: {
      "@env-import": { macros: [envImportMacro] },
    },
  })
}
