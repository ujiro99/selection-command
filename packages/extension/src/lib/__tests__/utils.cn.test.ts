import { describe, it, expect } from "vitest"
import { cn } from "../utils"

// cn() resolves Tailwind CSS class conflicts with tailwind-merge. These cases
// pin down its behavior for Tailwind CSS v4 class names (tailwind-merge v3).
describe("cn", () => {
  it("CN-01: 正常系: 条件付きのクラスを結合する", () => {
    expect(cn("flex", false && "hidden", undefined, null, "gap-2")).toBe(
      "flex gap-2",
    )
  })

  it("CN-02: 正常系: v4 で改名されたクラス同士の競合は後勝ちになる", () => {
    expect(cn("shadow-xs", "shadow-sm")).toBe("shadow-sm")
    expect(cn("rounded-xs", "rounded-sm", "rounded-md")).toBe("rounded-md")
    expect(cn("blur-xs", "blur-sm")).toBe("blur-sm")
    expect(cn("outline-hidden", "outline-none")).toBe("outline-none")
    expect(cn("bg-linear-to-r", "bg-linear-to-l")).toBe("bg-linear-to-l")
  })

  it("CN-03: 正常系: important 修飾子（末尾の !）付きのクラスを扱える", () => {
    expect(cn("h-full!", "h-[540px]!")).toBe("h-[540px]!")
  })

  it("CN-04: 正常系: CSS 変数の省略記法を扱える", () => {
    expect(cn("h-(--radix-select-trigger-height)", "h-[var(--other)]")).toBe(
      "h-[var(--other)]",
    )
  })

  it("CN-05: 正常系: 独自テーマの色と文字サイズは競合しない", () => {
    expect(cn("text-xs", "text-muted-foreground")).toBe(
      "text-xs text-muted-foreground",
    )
    expect(cn("bg-background", "bg-accent")).toBe("bg-accent")
  })

  it("CN-06: 正常系: 個別プロパティと短縮プロパティの競合を解決する", () => {
    expect(cn("px-2 py-1", "p-3")).toBe("p-3")
    expect(cn("p-3", "px-2")).toBe("p-3 px-2")
  })
})
