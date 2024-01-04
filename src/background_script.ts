import browser from 'webextension-polyfill';
import * as mv3 from 'mv3-hot-reload';

mv3.utils.setConfig({
  isDev: true,
});
mv3.background.init();

const main = async () => {
  let { count } = await browser.storage.local.get('count');
  if (!count || Number.isNaN(count)) {
    count = 0;
  }
  setInterval(async () => {
    console.log('count = ', ++count);
    await browser.storage.local.set({ count });
  }, 1000);
};

main().then(() => {});

export {};
