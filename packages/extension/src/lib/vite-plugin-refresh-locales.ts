import type { Plugin } from "vite"
import fs from "node:fs"
import path from "node:path"

const srcPath = "./public/_locales"
const destPath = "./dist/_locales"

export default function refreshLocales(): Plugin {
  return {
    name: "refresh-locales",
    buildStart(_options) {
      try {
        // Remove first
        fs.rmSync(destPath, { recursive: true, force: true })
        // Copy locale directory
        copyDir(srcPath, destPath)
      } catch (e) {
        console.error(e)
      }
    },
  }
}

function copyDir(src: string, dest: string) {
  try {
    fs.mkdirSync(dest, { recursive: true })
    const files = fs.readdirSync(src, { withFileTypes: true })
    for (const file of files) {
      const srcPath = path.join(src, file.name)
      const destPath = path.join(dest, file.name)

      if (file.isDirectory()) {
        copyDir(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  } catch (error) {
    console.error(error)
  }
}
