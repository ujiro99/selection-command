/** Encodes bytes as a base64 data URL. */
export const bytesToDataUrl = (bytes: Uint8Array, mimeType: string): string => {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("")
  return `data:${mimeType};base64,${btoa(binary)}`
}
