const fs = require('fs')
const { globSync } = require('glob')
const esbuild = require('esbuild')

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
      ],
      outdir: 'dist/src',
      minify: true,
      bundle: true,
      tsconfig: './tsconfig.json',
      plugins: [cleanup(['*'])],
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
