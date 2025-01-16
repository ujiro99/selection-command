import fs from 'node:fs'
import type { Plugin, ViteDevServer } from 'vite'

function touchFiles(filePaths: string[]): void {
  const time = new Date()
  filePaths.forEach((path) => {
    fs.utimesSync(path, time, time)
  })
}

type TouchCSSPluginOptions = {
  cssFilePaths: string[]
  watchRegexp: RegExp
}

export default function touchCSSPlugin({
  cssFilePaths,
  watchRegexp,
}: TouchCSSPluginOptions): Plugin {
  return {
    name: 'touch-css',
    configureServer(server: ViteDevServer) {
      server.watcher.on('change', (path: string) => {
        if (watchRegexp.test(path)) {
          if (!cssFilePaths.includes(path)) {
            touchFiles(cssFilePaths)
          }
        }
      })
    },
  }
}
