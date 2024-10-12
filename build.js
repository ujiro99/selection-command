const fs = require('fs')
const { globSync } = require('glob')
const esbuild = require('esbuild')

const package = JSON.parse(fs.readFileSync('package.json'))

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

const main = () => {
  esbuild
    .build({
      entryPoints: [
        'src/background_script.ts',
        'src/content_script.tsx',
        'src/options_page.tsx',
        'src/sandbox.tsx',
      ],
      outdir: 'dist/src',
      bundle: true,
      tsconfig: './tsconfig.json',
      plugins: [cleanup(['*'])],
      loader: {
        '.svg': 'text',
      },
      define: {
        'process.env.NAME': `"${package.name}"`,
        'process.env.VERSION': `"${package.version}"`,
        'process.env.NODE_ENV': '"production"',
      },
    })
    .then(() => console.log('⚡Bundle build complete ⚡'))
    .catch(() => {
      process.exit(1)
    })
}

main()
