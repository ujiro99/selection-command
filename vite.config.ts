import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { crx } from "@crxjs/vite-plugin"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import manifest from "./manifest.json"
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js"
import viteTouchCss from "./src/lib/vite-plugin-touch-css"
import removeCssFromContentScript from "./src/lib/vite-plugin-manifest"
import refreshLocales from "./src/lib/vite-plugin-refresh-locales"
import packageJson from "./package.json"
import { vitePluginMacro } from "vite-plugin-macro"
import { provideImportIf } from "./macros/importIfProvider"

const shouldUploadSourcemaps = process.env.UPLOAD_SOURCEMAP_TO_SENTRY === "true"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isWatchMode = process.argv.includes("--watch")
  loadEnv(mode, process.cwd(), "")

  const plugins = [
    react(),
    crx({ manifest }),
    vitePluginMacro({
      typesPath: path.resolve(__dirname, "./src/types/macros.d.ts"),
    })
      .use(provideImportIf({ mode }))
      .toPlugin(),
    viteTouchCss({
      cssFilePaths: [path.resolve(__dirname, "src/components/App.css")],
      watchRegexp: /src/,
    }),
    removeCssFromContentScript(),
    refreshLocales(),
  ]

  if (mode === "development") {
    plugins.push(
      cssInjectedByJsPlugin({
        dev: {
          enableDev: true,
        },
        injectCodeFunction: (cssCode: string, options) => {
          const upsertCss = (root: ShadowRoot | HTMLHeadElement) => {
            const fileName = options
              .attributes!["data-vite-dev-id"].split("/")
              .pop() as string
            options.attributes!["data-vite-dev-id"] = fileName
            const newCssNode = document.createTextNode(cssCode)
            let style = root.querySelector(
              `style[data-vite-dev-id='${fileName}']`,
            )
            if (style == null) {
              // case 1. Create a new style element.
              style = document.createElement("style")
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
                typeof document != "undefined" &&
                options.attributes != null
              ) {
                let targetId = "selection-command"
                if (
                  options.attributes["data-vite-dev-id"].match(/command_hub/)
                ) {
                  targetId = "selection-command-command-hub"
                }
                const root =
                  document.getElementById(targetId)?.shadowRoot ?? document.head // Option page
                upsertCss(root)
              }
            } catch (e) {
              console.error("vite-plugin-css-injected-by-js", e)
            }
          }, 0)
        },
      }),
    )
  }

  // For Sentry sourcemap upload
  if (shouldUploadSourcemaps) {
    plugins.push(
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "ujiro99",
        project: "selection-command",
        sourcemaps: {
          filesToDeleteAfterUpload: ["./dist/**/*.js.map"],
        },
      }),
    )
  }

  return {
    plugins,
    define: {
      __APP_NAME__: JSON.stringify(packageJson.name),
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: shouldUploadSourcemaps, // For Sentry
      emptyOutDir: !isWatchMode, // prevent deleting the dist folder when running in watch mode
      rollupOptions: {
        input: {
          clipboard: "src/clipboard.html",
        },
        output: {
          assetFileNames: (assetInfo) => {
            const keepNames = [
              "content_script.css",
              "icons.css",
              "command_hub.css",
            ]
            if (
              assetInfo.names?.length > 0 &&
              keepNames.includes(assetInfo.names[0])
            ) {
              return `assets/${assetInfo.names[0]}`
            }
            return "assets/[name]-[hash][extname]"
          },
        },
      },
    },
  }
})
