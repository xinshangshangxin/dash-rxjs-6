import * as fs from 'fs-extra';
import requestPromise from 'request-promise';

async function getCssUrl() {
  let html = await requestPromise('https://rxjs-dev.firebaseapp.com');

  if (/(styles\.\w+\.css)/.test(html)) {
    return `https://rxjs-dev.firebaseapp.com/${RegExp.$1}`;
  }

  throw new Error('no css found');
}

async function persistStyle(stylePath: string) {
  let url = await getCssUrl();
  let stylesheet = await requestPromise(url);

  await fs.ensureFile(stylePath);
  await fs.writeFile(stylePath, stylesheet);
}

export { persistStyle };
