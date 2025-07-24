export enum STORAGE_KEY {
  USER = 0,
  COMMAND_COUNT = 2,
  USER_STATS = 3,
  SHORTCUTS = 4,
  SYNC_COMMAND_METADATA = 5,
}

export enum LOCAL_STORAGE_KEY {
  CACHES = "caches",
  CLIENT_ID = "clientId",
  STARS = "stars",
  CAPTURES = "captures",
  MIGRATION_STATUS = "migrationStatus",
  LOCAL_COMMAND_METADATA = "localCommandMetadata",
  GLOBAL_COMMAND_METADATA = "globalCommandMetadata",
  COMMANDS_BACKUP = "commandsBackup",
  DAILY_COMMANDS_BACKUP = "dailyCommandsBackup",
  WEEKLY_COMMANDS_BACKUP = "weeklyCommandsBackup",
}

export enum SESSION_STORAGE_KEY {
  BG = "bg",
  SELECTION_TEXT = "selectionText ",
  SESSION_DATA = "sessionData",
  MESSAGE_QUEUE = "messageQueue",
  TMP_CAPTURES = "tmpCaptures",
  PA_RECORDING = "pageActionRecording",
  PA_RUNNING = "pageActionRunning",
  PA_CONTEXT = "pageActionContext",
  PA_RECORDER_OPTION = "pageActionRecorderOption",
}

export type KEY =
  | STORAGE_KEY
  | LOCAL_STORAGE_KEY
  | SESSION_STORAGE_KEY
  | CMD_KEY
  | CMD_LOCAL_KEY
  | string

export const CMD_PREFIX = "cmd-"

export type CMD_KEY = `${typeof CMD_PREFIX}${number}`
export type CMD_LOCAL_KEY = `${typeof CMD_PREFIX}local-${number}`
