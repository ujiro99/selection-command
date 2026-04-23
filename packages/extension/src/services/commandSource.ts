import { COMMAND_SOURCE_TYPE } from "@/const"
import type { SelectionCommand } from "@/types"

type CommandSourceFields = Pick<
  SelectionCommand,
  "id" | "sourceType" | "sourceId"
>

export const resolveCommandSource = (
  command: CommandSourceFields,
): { sourceType: COMMAND_SOURCE_TYPE; sourceId: string | undefined } => {
  return {
    sourceType: command.sourceType ?? COMMAND_SOURCE_TYPE.UNKNOWN,
    sourceId: command.sourceId,
  }
}
