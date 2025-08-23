import Tags from "@/data/tags.json"
import { Tag } from "@/types"
import { generateUUIDFromObject } from "@/lib/utils"

/**
 * Get tags.
 */
export function getTags(): Tag[] {
  return Tags.map((c) => ({
    id: generateUUIDFromObject({ name: c.name }),
    name: c.name,
  }))
}
