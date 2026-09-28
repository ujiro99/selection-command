import { shouldPreserveIconColor } from "@/lib/favicon"
import type { IconColorQuery, Sender } from "@/services/ipc"

/**
 * Answers, for each query, whether the icon must keep its own colors instead of
 * being recolored by the global icon color setting.
 *
 * The same-site part of that check needs the Public Suffix List, which is far
 * too large to ship into every page the content script runs on, so the menu
 * asks the service worker rather than importing the check itself.
 */
export const resolveIconColors = (
  queries: IconColorQuery[],
  _sender: Sender,
  response: (res: unknown) => void,
): boolean => {
  response(queries.map((query) => shouldPreserveIconColor(query)))
  return false
}
