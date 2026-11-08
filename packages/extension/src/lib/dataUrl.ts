/** Bytes per String.fromCharCode call, well below the argument limit. */
const CHUNK_SIZE = 0x8000

/** Encodes bytes as a base64 data URL. */
export const bytesToDataUrl = (bytes: Uint8Array, mimeType: string): string => {
  // Convert in chunks to avoid an intermediate array of one string per byte.
  let binary = ""
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}
