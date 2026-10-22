import React, { useState, useEffect } from "react"
import MultiProgress from "react-multi-progress"
import { Cloud, Monitor } from "lucide-react"
import {
  subscribeStorageUsage,
  StorageUsageData,
} from "@/services/storage/storageUsage"
import { cn } from "@/lib/utils"
import { useThemeContext } from "@/hooks/useTheme"

import s from "./Option.module.css"

// Bar colors, passed inline to MultiProgress. Must match the legend's classes.
const BAR_COLORS = {
  light: {
    system: "#4b5563", // gray-600
    commands: "#9ca3af", // gray-400
    hatching: "#fff", // Background under bgHatching's stripes
    free: "#e5e7eb", // gray-200
    track: "#f3f4f6", // gray-100
  },
  dark: {
    system: "#d1d5db", // gray-300
    commands: "#6b7280", // gray-500
    hatching: "#111827", // gray-900
    free: "#374151", // gray-700
    track: "#1f2937", // gray-800
  },
}

const StorageUsage: React.FC = () => {
  const colors = BAR_COLORS[useThemeContext()]
  const [storageData, setStorageData] = useState<StorageUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStorageUsage = async (data: StorageUsageData) => {
      try {
        setLoading(true)
        setStorageData(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load storage usage:", err)
        setError("Failed to load storage usage")
      } finally {
        setLoading(false)
      }
    }
    return subscribeStorageUsage(loadStorageUsage)
  }, [])

  if (loading) {
    return (
      <div className={cn(s.menu, "w-[240px]")}>
        <h3 className={s.menuLabel}>Storage Usage</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium font-mono mb-2">
          Loading...
        </p>
      </div>
    )
  }

  if (error || !storageData) {
    return (
      <div className={cn(s.menu, "w-[240px]")}>
        <h3 className={s.menuLabel}>Storage Usage</h3>
        <p className="text-red-500">{error || "No data available"}</p>
      </div>
    )
  }

  const syncElements = [
    {
      value: storageData.sync.systemPercent,
      color: colors.system,
      name: "System",
    },
    {
      value: storageData.sync.commandsPercent,
      color: colors.commands,
      name: "Commands",
    },
    {
      value: storageData.sync.reservedPercent,
      color: colors.hatching,
      name: "Reserved",
      className: s.bgHatching,
    },
    {
      value: storageData.sync.freePercent,
      color: colors.free,
      name: "Free",
    },
  ]

  const localElements = [
    {
      value: storageData.local.systemPercent,
      color: colors.system,
      name: "System",
    },
    {
      value: storageData.local.commandsPercent,
      color: colors.commands,
      name: "Commands",
    },
    {
      value: storageData.local.backupPercent,
      color: colors.hatching,
      name: "Backup",
      className: s.bgHatching,
    },
    {
      value: storageData.local.freePercent,
      color: colors.free,
      name: "Free",
    },
  ]

  return (
    <div className={cn(s.menu, "w-[240px]")}>
      <h3 className={s.menuLabel}>Storage Usage</h3>
      <div className="pl-2 mb-6 w-full">
        <h4 className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium font-mono my-2">
          <Cloud
            className="inline mr-2 stroke-gray-500 dark:stroke-gray-400"
            size={17}
          />
          Sync Area
        </h4>
        <MultiProgress
          elements={syncElements}
          height={8}
          backgroundColor={colors.track}
          className="w-full"
        />
        <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-3 pl-1 grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-600 dark:bg-gray-300 rounded-sm mr-1"></div>
            <span>System: {storageData.sync.systemPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-sm mr-1"></div>
            <span>Commands: {storageData.sync.commandsPercent}%</span>
          </div>
          <div className="flex items-center">
            <div
              className={cn("w-3 h-3 border rounded-sm mr-1", s.bgHatching)}
            ></div>
            <span>Reserved: {storageData.sync.reservedPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm mr-1"></div>
            <span>Free: {storageData.sync.freePercent}%</span>
          </div>
        </div>
      </div>

      <div className="pl-2 w-full">
        <h4 className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-medium font-mono my-2">
          <Monitor
            className="inline mr-2 stroke-gray-500 dark:stroke-gray-400"
            size={17}
          />
          Local Area
        </h4>
        <MultiProgress
          elements={localElements}
          height={8}
          backgroundColor={colors.track}
          className="w-full"
        />
        <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-3 pl-1 grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-600 dark:bg-gray-300 rounded-sm mr-1"></div>
            <span>System: {storageData.local.systemPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-sm mr-1"></div>
            <span>Commands: {storageData.local.commandsPercent}%</span>
          </div>
          <div className="flex items-center">
            <div
              className={cn("w-3 h-3 border rounded-sm mr-1", s.bgHatching)}
            ></div>
            <span>Backup: {storageData.local.backupPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm mr-1"></div>
            <span>Free: {storageData.local.freePercent}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StorageUsage
