import { describe, it, expect } from "vitest"
import postcss from "postcss"
import shadowDomProperties from "../postcss-shadow-dom-properties"

const run = async (css: string, opts?: { prefix?: string }) => {
  const result = await postcss([shadowDomProperties(opts)]).process(css, {
    from: undefined,
  })
  return result.root
}

const findLayer = (root: postcss.Root) => {
  let layer: postcss.AtRule | undefined
  root.walkAtRules("layer", (atRule) => {
    if (atRule.params === "properties" && atRule.nodes) layer = atRule
  })
  return layer
}

const declsOf = (rule: postcss.Rule) => {
  const decls: Record<string, string> = {}
  rule.walkDecls((decl) => {
    decls[decl.prop] = decl.value
  })
  return decls
}

describe("postcss-shadow-dom-properties", () => {
  it("SDP-01: 正常系: 非継承の @property の初期値を全要素向けに宣言する", async () => {
    // Arrange
    const css = `
      @property --tw-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
      @property --tw-translate-x { syntax: "*"; inherits: false; initial-value: 0; }
    `

    // Act
    const root = await run(css)

    // Assert
    const layer = findLayer(root)
    expect(layer).toBeDefined()
    const rule = layer!.first as postcss.Rule
    expect(rule.selector).toBe(":host, *, ::before, ::after, ::backdrop")
    expect(declsOf(rule)).toEqual({
      "--tw-shadow": "0 0 #0000",
      "--tw-translate-x": "0",
    })
  })

  it("SDP-02: 正常系: 継承する @property は :host / :root にのみ宣言する", async () => {
    // Arrange
    const css = `
      @property --tw-font-weight { syntax: "*"; inherits: true; initial-value: 400; }
      @property --tw-blur { syntax: "*"; inherits: false; initial-value: 0; }
    `

    // Act
    const root = await run(css)

    // Assert
    const rules = findLayer(root)!.nodes as postcss.Rule[]
    expect(rules).toHaveLength(2)
    expect(rules[0].selector).toBe(":host, :root")
    expect(declsOf(rules[0])).toEqual({ "--tw-font-weight": "400" })
    expect(rules[1].selector).toBe(":host, *, ::before, ::after, ::backdrop")
    expect(declsOf(rules[1])).toEqual({ "--tw-blur": "0" })
  })

  it("SDP-03: 正常系: initial-value を持たない非継承の @property は全要素で initial にリセットする", async () => {
    // Arrange
    const css = `
      @property --tw-ring-color { syntax: "*"; inherits: false; }
      @property --tw-ring-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
    `

    // Act
    const root = await run(css)

    // Assert
    // Declared on every element so that a value set on an ancestor is not
    // inherited by descendants.
    const rule = findLayer(root)!.first as postcss.Rule
    expect(rule.selector).toBe(":host, *, ::before, ::after, ::backdrop")
    expect(declsOf(rule)).toEqual({
      "--tw-ring-color": "initial",
      "--tw-ring-shadow": "0 0 #0000",
    })
  })

  it("SDP-10: 正常系: initial-value を持たない継承の @property は :host / :root で initial にリセットする", async () => {
    // Arrange
    const css = `
      @property --tw-leading { syntax: "*"; inherits: true; }
    `

    // Act
    const root = await run(css)

    // Assert
    // Declared on the shadow host so that values from the host page do not
    // leak into the shadow tree.
    const rules = findLayer(root)!.nodes as postcss.Rule[]
    expect(rules).toHaveLength(1)
    expect(rules[0].selector).toBe(":host, :root")
    expect(declsOf(rules[0])).toEqual({ "--tw-leading": "initial" })
  })

  it("SDP-04: 正常系: 接頭辞が一致しない @property は対象外とする", async () => {
    // Arrange
    const css = `
      @property --my-color { syntax: "<color>"; inherits: false; initial-value: red; }
    `

    // Act
    const root = await run(css)

    // Assert
    expect(findLayer(root)).toBeUndefined()
  })

  it("SDP-05: 正常系: 接頭辞をオプションで変更できる", async () => {
    // Arrange
    const css = `
      @property --my-color { syntax: "<color>"; inherits: false; initial-value: red; }
    `

    // Act
    const root = await run(css, { prefix: "--my-" })

    // Assert
    const rule = findLayer(root)!.first as postcss.Rule
    expect(declsOf(rule)).toEqual({ "--my-color": "red" })
  })

  it("SDP-06: 境界値: @property が無い場合は CSS を変更しない", async () => {
    // Arrange
    const css = ".a { color: red; }"

    // Act
    const root = await run(css)

    // Assert
    expect(root.toString()).toBe(css)
  })

  it("SDP-07: 正常系: 元の @property 定義は残す", async () => {
    // Arrange
    const css =
      '@property --tw-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }'

    // Act
    const root = await run(css)

    // Assert
    let count = 0
    root.walkAtRules("property", () => {
      count++
    })
    expect(count).toBe(1)
  })

  it("SDP-08: 正常系: properties レイヤーの順序を CSS の先頭で宣言する", async () => {
    // Arrange
    const css = `
      @layer utilities { .shadow { --tw-shadow: 0 1px 3px #0000001a; } }
      @property --tw-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
    `

    // Act
    const root = await run(css)

    // Assert
    const first = root.first as postcss.AtRule
    expect(first.type).toBe("atrule")
    expect(first.name).toBe("layer")
    expect(first.params).toBe("properties")
    expect(first.nodes).toBeUndefined()
  })

  it("SDP-09: 正常系: @property が無くてもレイヤーを使う CSS では順序を宣言する", async () => {
    // Arrange
    const css = "@layer utilities { .a { color: red; } }"

    // Act
    const root = await run(css)

    // Assert
    const first = root.first as postcss.AtRule
    expect(first.name).toBe("layer")
    expect(first.params).toBe("properties")
    expect(first.nodes).toBeUndefined()
    expect(findLayer(root)).toBeUndefined()
  })
})
