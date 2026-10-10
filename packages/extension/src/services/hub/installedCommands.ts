import type { Command } from "@/types"

export type InstalledCommand = {
  id: string
  /** Present only when the command has one (ISO 8601). */
  contentUpdatedAt?: string
}

export type SyncInstalledCommand = {
  action: "SyncInstalledCommand"
  installedCommands: InstalledCommand[]
}

/** Builds the installed-command list sent to the Hub. */
export function toSyncInstalledCommand(
  commands: Command[],
): SyncInstalledCommand {
  return {
    action: "SyncInstalledCommand",
    installedCommands: commands.map((c) =>
      c.contentUpdatedAt
        ? { id: c.id, contentUpdatedAt: c.contentUpdatedAt }
        : { id: c.id },
    ),
  }
}
