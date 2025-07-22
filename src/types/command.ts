// Type definitions for command storage
export interface CommandMetadata {
  count: number // Number of commands saved in this storage
  version: number // Data version (timestamp)
}

export interface GlobalCommandMetadata {
  globalOrder: string[] // Global command order array
  version: number // Global data version (timestamp)
  lastUpdated: number // Last update timestamp
}
