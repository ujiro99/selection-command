# ts-react-chrome-ext
Chrome extension boilerplate with React and TypeScript.

![autoreload.gif](https://raw.githubusercontent.com/wiki/mpppk/ts-react-chrome-ext/images/autoreload.gif)


## Features
* Fast build powered by [esbuild](https://github.com/evanw/esbuild)
* Auto Reloading
* Watch mode

### Note
If you are interested in using [create-react-app](https://github.com/facebook/create-react-app), see also [mpppk/chrome-ext-with-cra-ts](https://github.com/mpppk/chrome-ext-with-cra-ts).  
It includes cra, but take more build-time than this boilerplate.

## Load your Chrome extension
Build your extension, then click 「LOAD UNPACKED」 button on `chrome://extensions`, then select `dist` dir.  
(See https://developer.chrome.com/extensions/getstarted)

## Build
`yarn build` transpile and bundle your TypeScript sources to `dist/src`, then reload chrome extension and current tab.

```
$ yarn build
```

## Watch mode
You can enter the watch mode by running `yarn watch`.

```
$ yarn watch
build src/background_script.ts
build src/content_script.tsx
build src/hot_reload.ts
build src/options_page.tsx
build src/content_script.tsx
```

## Hot Reloading
Thanks to [src/hot_reload.ts](https://github.com/mpppk/ts-react-chrome-ext/blob/master/src/hot_reload.ts) (inspired by [xpl/crx-hotreload](https://github.com/xpl/crx-hotreload)), if you execute `yarn build` or `yarn watch`, Chrome extension and active tab are reloaded automatically.
You can also reload actively by running `yarn reload`.

```
$ yarn reload
```