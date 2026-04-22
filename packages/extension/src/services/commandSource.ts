import { COMMAND_SOURCE_TYPE } from "@/const"
import type { SelectionCommand } from "@/types"

type CommandSourceFields = Pick<SelectionCommand, "id" | "sourceType" | "sourceId">

export const resolveCommandSource = (
  command: CommandSourceFields,
): { sourceType: COMMAND_SOURCE_TYPE; sourceId: string } => {
  return {
    sourceType: command.sourceType ?? COMMAND_SOURCE_TYPE.UNKNOWN,
    sourceId: command.sourceId ?? command.id,
  }
}

export const setCommandSource = <T extends CommandSourceFields>(
  command: T,
  sourceType: COMMAND_SOURCE_TYPE,
  sourceId?: string,
): T => {
  command.sourceType = sourceType
  command.sourceId = sourceId ?? command.id
  return command
}
