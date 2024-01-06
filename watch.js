const esbuild = require('esbuild')

const main = async () => {
  const context = await esbuild.context({
    entryPoints: [
      'src/background_script.ts',
      'src/content_script.tsx',
      'src/options_page.tsx',
    ],
    outdir: 'dist/src',
    minify: false,
    bundle: true,
    logLevel: 'info',
  })

  await context.watch()
}

main()
