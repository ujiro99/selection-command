import { useMemo } from "react"
import { CACHE_SECTIONS } from "@/services/settings/settingsCache"
import { useSection, useUserSettings } from "./useSettings"
import { shouldPreserveIconColor } from "@/lib/favicon"
import { isEmpty } from "@/lib/utils"
import type { Command, CommandFolder } from "@/types"

/**
 * A menu entry whose icon has been resolved against the image cache.
 *
 * `iconUrl` becomes the cached data URL whenever the cache holds one, and a data
 * URL carries no hint about where the icon came from. Anything that depends on
 * the icon's origin is therefore decided here, while the user-configured URL is
 * still at hand, and handed to the menu as `preserveOriginalColor`.
 */
type ResolvedIcon = {
  /** Whether the icon must keep its own colors instead of being recolored. */
  preserveOriginalColor: boolean
}

export type ResolvedCommand = Command & ResolvedIcon
export type ResolvedFolder = CommandFolder & ResolvedIcon

type HasIconUrl = { id: string; iconUrl?: string }

/** Replaces the icon URL with its cached data URL when one is available. */
function applyImageCache<T extends HasIconUrl>(
  item: T,
  images: Record<string, string> | undefined,
): T {
  if (!item.iconUrl || !images) return item
  const cache = images[item.iconUrl]
  return isEmpty(cache) ? item : { ...item, iconUrl: cache }
}

/** Resolves a command's icon: the URL to render plus the recoloring decision. */
function resolveCommandIcon(
  command: Command,
  images: Record<string, string> | undefined,
): ResolvedCommand {
  return {
    ...applyImageCache(command, images),
    preserveOriginalColor: shouldPreserveIconColor({
      url: command.iconUrl,
      command,
    }),
  }
}

/** Resolves a folder's icon: the URL to render plus the recoloring decision. */
function resolveFolderIcon(
  folder: CommandFolder,
  images: Record<string, string> | undefined,
): ResolvedFolder {
  return {
    ...applyImageCache(folder, images),
    preserveOriginalColor: shouldPreserveIconColor({ url: folder.iconUrl }),
  }
}

/**
 * User settings whose commands and folders are ready to render: icons come from
 * the image cache and their recoloring decision is already resolved.
 */
export function useSettingsWithImageCache() {
  const { userSettings, loading: loadingSettings } = useUserSettings()
  const { data: commands, loading: loadingCommands } = useSection(
    CACHE_SECTIONS.COMMANDS,
  )
  const { data: caches, loading: loadingCaches } = useSection(
    CACHE_SECTIONS.CACHES,
  )
  const loading = loadingSettings || loadingCommands || loadingCaches

  const resolved = useMemo<{
    commands: ResolvedCommand[]
    folders: ResolvedFolder[]
  }>(() => {
    if (loading || !commands) {
      return { commands: [], folders: [] }
    }

    const images = caches?.images
    return {
      commands: commands.map((c) => resolveCommandIcon(c, images)),
      folders: (userSettings.folders ?? []).map((f) =>
        resolveFolderIcon(f, images),
      ),
    }
  }, [userSettings, loading, caches, commands])

  return {
    userSettings,
    commands: resolved.commands,
    folders: resolved.folders,
    loading,
  }
}
