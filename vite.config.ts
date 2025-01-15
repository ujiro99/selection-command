import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isWatchMode = process.argv.includes('--watch')
  loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      crx({ manifest }),
      mode === 'development' &&
        cssInjectedByJsPlugin({
          dev: {
            enableDev: true,
          },
          injectCodeFunction: (cssCode: string, options) => {
            setTimeout(() => {
              try {
                if (
                  typeof document != 'undefined' &&
                  options.attributes != null
                ) {
                  let targetId = 'selection-command'
                  if (
                    options.attributes['data-vite-dev-id'].match(/command_hub/)
                  ) {
                    targetId = 'selection-command-command-hub'
                  }
                  const root = document.getElementById(targetId)
                  const shadow = root?.shadowRoot
                  if (shadow != null) {
                    const style = document.createElement('style')
                    // SET ALL ATTRIBUTES
                    for (const attribute in options.attributes) {
                      style.setAttribute(
                        attribute,
                        options.attributes[attribute],
                      )
                    }
                    style.appendChild(document.createTextNode(cssCode))
                    shadow.appendChild(style)
                  }
                }
              } catch (e) {
                console.error('vite-plugin-css-injected-by-js', e)
              }
            }, 0)
          },
        }),
    ],
    cssCodeSplit: false,
    define: {
      __APP_NAME__: JSON.stringify(packageJson.name),
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      emptyOutDir: !isWatchMode, // prevent deleting the dist folder when running in watch mode
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            const keepNames = ['App.css', 'command_hub.css']
            if (
              assetInfo.names?.length > 0 &&
              keepNames.includes(assetInfo.names[0])
            ) {
              return `assets/${assetInfo.names[0]}`
            }
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
    },
  }
})
