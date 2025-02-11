import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import viteTouchCss from './src/lib/vite-plugin-touch-css'
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
            const upsertCss = (root: ShadowRoot | HTMLHeadElement) => {
              const fileName = options
                .attributes!['data-vite-dev-id'].split('/')
                .pop() as string
              options.attributes!['data-vite-dev-id'] = fileName
              const newCssNode = document.createTextNode(cssCode)
              let style = root.querySelector(
                `style[data-vite-dev-id='${fileName}']`,
              )
              if (style == null) {
                // case 1. Create a new style element.
                style = document.createElement('style')
                for (const attr in options.attributes) {
                  style.setAttribute(attr, options.attributes[attr])
                }
                style.appendChild(newCssNode)
                root.appendChild(style)
              } else {
                // case 2. Update the existing style element.
                const oldTextNode = style.firstChild
                if (oldTextNode) {
                  style.replaceChild(newCssNode, oldTextNode)
                }
              }
            }
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
                  const root =
                    document.getElementById(targetId)?.shadowRoot ??
                    document.head // Option page
                  upsertCss(root)
                }
              } catch (e) {
                console.error('vite-plugin-css-injected-by-js', e)
              }
            }, 0)
          },
        }),
      viteTouchCss({
        cssFilePaths: [path.resolve(__dirname, 'src/components/App.css')],
        watchRegexp: /src/,
      }),
    ],
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
            const keepNames = [
              'content_script.css',
              'Popup.css',
              'command_hub.css',
            ]
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
