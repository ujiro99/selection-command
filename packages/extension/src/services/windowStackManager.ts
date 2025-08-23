import { BgData } from "./backgroundData"
import type { WindowType, WindowLayer } from "@/types"

/**
 * Window Stack Manager
 * Manages popup window stack structure for ServiceWorker environment
 */
export class WindowStackManager {
  /**
   * Save stack to BgData
   */
  private static async saveStack(stack: WindowLayer[]): Promise<void> {
    await BgData.update(() => ({ windowStack: stack }))
  }

  /**
   * Load stack from BgData
   */
  private static async loadStack(): Promise<WindowLayer[]> {
    const data = BgData.get()
    return data.windowStack
  }

  /**
   * Add window to stack.
   */
  static async addWindow(
    window: WindowType,
    parentWindowId?: number,
  ): Promise<void> {
    const stack = await this.loadStack()

    if (parentWindowId) {
      // Find the layer containing the parent window
      const parentLayerIndex = stack.findIndex((layer) =>
        layer.some((w) => w.id === parentWindowId),
      )

      if (parentLayerIndex >= 0) {
        // Check if there's already a layer after the parent layer
        const nextLayerIndex = parentLayerIndex + 1
        if (nextLayerIndex < stack.length) {
          // Add to existing next layer
          stack[nextLayerIndex].push(window)
        } else {
          // Create new layer after the parent layer
          stack.splice(nextLayerIndex, 0, [window])
        }
      } else {
        // Parent not found, check if there's already a layer with the same srcWindowId
        const existingLayerWithSameSrc = stack.find(
          (layer) =>
            layer.length > 0 && layer[0].srcWindowId === parentWindowId,
        )

        if (existingLayerWithSameSrc) {
          // Add to existing layer with same srcWindowId
          existingLayerWithSameSrc.push(window)
        } else {
          // Create new layer at the end
          stack.push([window])
        }
      }
    } else {
      // No parent specified, add to end
      stack.push([window])
    }

    await this.saveStack(stack)
  }

  /**
   * Add multiple windows to stack at once
   */
  static async addWindows(
    windowsToAdd: Array<{
      window: WindowType
      parentWindowId?: number
    }>,
  ): Promise<void> {
    const stack = await this.loadStack()

    // Process each window addition
    for (const { window, parentWindowId } of windowsToAdd) {
      if (parentWindowId) {
        // Find the layer containing the parent window
        const parentLayerIndex = stack.findIndex((layer) =>
          layer.some((w) => w.id === parentWindowId),
        )

        if (parentLayerIndex >= 0) {
          // Check if there's already a layer after the parent layer
          const nextLayerIndex = parentLayerIndex + 1
          if (nextLayerIndex < stack.length) {
            // Add to existing next layer
            stack[nextLayerIndex].push(window)
          } else {
            // Create new layer after the parent layer
            stack.splice(nextLayerIndex, 0, [window])
          }
        } else {
          // Parent not found, check if there's already a layer with the same srcWindowId
          const existingLayerWithSameSrc = stack.find(
            (layer) =>
              layer.length > 0 && layer[0].srcWindowId === parentWindowId,
          )

          if (existingLayerWithSameSrc) {
            // Add to existing layer with same srcWindowId
            existingLayerWithSameSrc.push(window)
          } else {
            // Create new layer at the end
            stack.push([window])
          }
        }
      } else {
        // No parent specified, add to end
        stack.push([window])
      }
    }

    await this.saveStack(stack)
  }

  /**
   * Remove window from stack
   */
  static async removeWindow(windowId: number): Promise<void> {
    const stack = await this.loadStack()
    let changed = false

    for (let layerIndex = 0; layerIndex < stack.length; layerIndex++) {
      const layer = stack[layerIndex]
      const windowIndex = layer.findIndex((w) => w.id === windowId)

      if (windowIndex >= 0) {
        // Remove window from layer
        layer.splice(windowIndex, 1)
        changed = true

        // If layer is empty, remove the layer
        if (layer.length === 0) {
          stack.splice(layerIndex, 1)
        }
        break
      }
    }

    if (changed) {
      await this.saveStack(stack)
    }
  }

  /**
   * Get windows to close based on focus change
   */
  static async getWindowsToClose(
    focusedWindowId: number,
  ): Promise<WindowType[]> {
    const stack = await this.loadStack()

    // Find the layer index containing the focused window
    const focusedLayerIndex = stack.findIndex((layer) =>
      layer.some((w) => w.id === focusedWindowId),
    )

    // If focused window is not in stack, close all windows
    if (focusedLayerIndex < 0) {
      return stack.flat()
    }

    // Close all windows in layers after the focused layer
    const windowsToClose: WindowType[] = []
    for (let i = focusedLayerIndex + 1; i < stack.length; i++) {
      windowsToClose.push(...stack[i])
    }

    return windowsToClose
  }

  /**
   * Get current stack
   */
  static async getStack(): Promise<WindowLayer[]> {
    return await this.loadStack()
  }

  /**
   * Clean up empty layers
   */
  static async cleanupEmptyLayers(): Promise<void> {
    const stack = await this.loadStack()
    const originalLength = stack.length

    // Remove empty layers
    const cleanedStack = stack.filter((layer) => layer.length > 0)

    // Only save if there were changes
    if (cleanedStack.length !== originalLength) {
      await this.saveStack(cleanedStack)
    }
  }
}
