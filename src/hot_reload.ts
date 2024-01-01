import { browser } from 'webextension-polyfill-ts';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const reload = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id as number);
    }
    browser.runtime.reload();
  });
};

const main = async (): Promise<any> => {
  const extInfo = await browser.management.getSelf();
  if (extInfo.installType === 'development') {
    chrome.runtime.getPackageDirectoryEntry(async (dir) => {
      let lastModified: number | null = null;
      const successCallback = (entry: FileEntry) => {
        entry.file((file) => {
          if (lastModified === null) {
            lastModified = file.lastModified;
          } else if (lastModified < file.lastModified) {
            reload();
          }
        });
      }
      const errCallback = () => lastModified = -1;
      while (true) {
        dir.getFile('reload', { create: false }, successCallback, errCallback);
        await sleep(1000);
      }
    });
  }
};

main();
export {};

