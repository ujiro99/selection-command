// Placeholder token embedded into the built content_script bundle via Vite's
// `define`, then swapped for the real CSS file list in the emitted JS asset
// by removeCssFromContentScript's writeBundle hook (see vite-plugin-manifest.ts).
// The real list isn't known until crxjs finishes hashing chunks, so it can't
// be supplied through `define` directly - same approach as vite-plugin-pwa's
// `self.__WB_MANIFEST` injection.
export const CONTENT_SCRIPT_CSS_PLACEHOLDER =
  "__CONTENT_SCRIPT_CSS_FILES_PLACEHOLDER__"
