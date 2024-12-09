const fs = require('fs')
const { globSync } = require('glob')
const esbuild = require('esbuild')
const { tailwindPlugin } = require('esbuild-plugin-tailwindcss')

const package = JSON.parse(fs.readFileSync('package.json'))
const env = JSON.parse(fs.readFileSync('env.json'))

const define = {}
Object.keys(env).forEach(
  (key) => (define[`process.env.${key}`] = `"${env[key]}"`),
)

function cleanup({ pattern = '*' }) {
  return {
    name: 'esbuild:cleanup',
    setup(build) {
      const options = build.initialOptions
      build.onStart((result) => {
        let files = globSync(options.outdir + '/' + pattern)
        files.forEach((path) => {
          fs.unlinkSync(path)
        })
      })
    },
  }
}

const main = async () => {
  const context = await esbuild.context({
    entryPoints: [
      'src/background_script.ts',
      'src/content_script.tsx',
      'src/options_page.tsx',
      'src/sandbox.tsx',
    ],
    outdir: 'dist/src',
    minify: false,
    bundle: true,
    tsconfig: './tsconfig.json',
    plugins: [
      tailwindPlugin({
        cssModulesEnabled: true,
      }),
      cleanup(['*']),
    ],
    loader: {
      '.svg': 'text',
    },
    logLevel: 'info',
    define: {
      'process.env.NAME': `"${package.name}"`,
      'process.env.VERSION': `"${package.version}"`,
      'process.env.NODE_ENV': '"development"',
      ...define,
    },
  })

  await context.watch()
}

main()
