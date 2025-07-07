import React, { useState, useEffect } from "react"
import MultiProgress from "react-multi-progress"
import { Cloud, Monitor } from "lucide-react"
import {
  subscribeStorageUsage,
  StorageUsageData,
} from "@/services/storage/storageUsage"
import { cn } from "@/lib/utils"

import s from "./Option.module.css"

const StorageUsage: React.FC = () => {
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
        <p className="text-sm text-gray-600 font-medium font-mono mb-2">
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
      color: "#4b5563", // gray-600
      name: "System",
    },
    {
      value: storageData.sync.commandsPercent,
      color: "#9ca3af", // gray-400
      name: "Commands",
    },
    {
      value: storageData.sync.reservedPercent,
      color: "#fff",
      name: "Reserved",
      className: s.bgHatching,
    },
    {
      value: storageData.sync.freePercent,
      color: "#e5e7eb", // gray-200
      name: "Free",
    },
  ]

  const localElements = [
    {
      value: storageData.local.systemPercent,
      color: "#4b5563", // gray-600
      name: "System",
    },
    {
      value: storageData.local.commandsPercent,
      color: "#9ca3af", // gray-400
      name: "Commands",
    },
    {
      value: storageData.local.backupPercent,
      color: "#fff",
      name: "Backup",
      className: s.bgHatching,
    },
    {
      value: storageData.local.freePercent,
      color: "#e5e7eb", // gray-200
      name: "Free",
    },
  ]

  return (
    <div className={cn(s.menu, "w-[240px]")}>
      <h3 className={s.menuLabel}>Storage Usage</h3>
      <div className="pl-2 mb-6 w-full">
        <h4 className="flex items-center text-sm text-gray-600 font-medium font-mono my-2">
          <Cloud className="inline mr-2 stroke-gray-500" size={17} />
          Sync Area
        </h4>
        <MultiProgress
          elements={syncElements}
          height={8}
          backgroundColor="#f3f4f6"
          className="w-full"
        />
        <div className="text-[11px] text-gray-600 mt-3 pl-1 grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-600 rounded-sm mr-1"></div>
            <span>System: {storageData.sync.systemPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-sm mr-1"></div>
            <span>Commands: {storageData.sync.commandsPercent}%</span>
          </div>
          <div className="flex items-center">
            <div
              className={cn("w-3 h-3 border rounded-sm mr-1", s.bgHatching)}
            ></div>
            <span>Reserved: {storageData.sync.reservedPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded-sm mr-1"></div>
            <span>Free: {storageData.sync.freePercent}%</span>
          </div>
        </div>
      </div>

      <div className="pl-2 w-full">
        <h4 className="flex items-center text-sm text-gray-600 font-medium font-mono my-2">
          <Monitor className="inline mr-2 stroke-gray-500" size={17} />
          Local Area
        </h4>
        <MultiProgress
          elements={localElements}
          height={8}
          backgroundColor="#f3f4f6"
          className="w-full"
        />
        <div className="text-[11px] text-gray-600 mt-3 pl-1 grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-600 rounded-sm mr-1"></div>
            <span>System: {storageData.local.systemPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-sm mr-1"></div>
            <span>Commands: {storageData.local.commandsPercent}%</span>
          </div>
          <div className="flex items-center">
            <div
              className={cn("w-3 h-3 border rounded-sm mr-1", s.bgHatching)}
            ></div>
            <span>Backup: {storageData.local.backupPercent}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded-sm mr-1"></div>
            <span>Free: {storageData.local.freePercent}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StorageUsage
