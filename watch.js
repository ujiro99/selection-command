const esbuild = require('esbuild')
const fs = require('fs')

let insertCssToShadowDom = {
  name: 'insertCssToShadowDom',
  setup(build) {
    const template = (css) =>
      `(() => {` +
      `let s = document.createElement('style');` +
      `s.append(document.createTextNode(${JSON.stringify(css)}));` +
      `document.getElementById('selection-popup').shadowRoot.append(s)` +
      `})()`
    build.onEnd(async (result) => {
      let css = await fs.promises.readFile(
        'dist/src/content_script.css',
        'utf8',
      )
      let appendCss = template(css)
      fs.appendFile('dist/src/content_script.js', appendCss, (err) => {
        if (err) throw err
        console.log('Css was inserted to content_script.js.')
      })
    })
  },
}

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
    plugins: [insertCssToShadowDom],
  })

  await context.watch()
}

main()
