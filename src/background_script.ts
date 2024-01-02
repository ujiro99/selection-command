import 'mv3-hot-reload/background';
import browser from 'webextension-polyfill';

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
