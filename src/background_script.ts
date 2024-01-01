import { browser } from "webextension-polyfill-ts";

const main = async () => {
  let {count} = (await browser.storage.local.get('count'));
  if (!count || Number.isNaN(count)) {
    count = 0;
  }
  setInterval(async () => {
    console.log("count = ", ++count);
    await browser.storage.local.set({count});
  }, 1000);
};

main().then(() => {});

export {};
