declare module "*.css"
declare module "*.module.css"

declare module "*.svg" {
  const content: string
  export default content
}

declare module "colorthief"

declare type FontCSS = Pick<
  CSSStyleDeclaration,
  | "fontFamily"
  | "fontWeight"
  | "fontStyle"
  | "fontSize"
  | "color"
  | "lineHeight"
  | "letterSpacing"
>
