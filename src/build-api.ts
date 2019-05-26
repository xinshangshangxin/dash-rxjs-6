import { map as bbMap } from 'bluebird';
import * as fs from 'fs-extra';
import { parse as pathParse, resolve as pathResolve } from 'path';
import request from 'request';
import requestPromise from 'request-promise';
import { pipeline as originPipeline } from 'stream';
import { promisify } from 'util';

import { createDatabase, DashApi } from './db';
import { persistStyle } from './fetch-style';

const pipeline = promisify(originPipeline);

interface TypeMap {
  const: string;
  interface: string;
  class: string;
  function: string;
  'type-alias': string;
}

interface ApiItem {
  name: string;
  title: string;
  path: string;
  docType: keyof TypeMap;
  stability: string;
  securityRisk: boolean;
}

interface ApiGroup {
  name: string;
  title: string;
  items: ApiItem[];
}

let sources: {
  prettierJs: string;
  codeBuildHtml: string;
  hrefReplaceHtml: string;
};

let typeMap: TypeMap = {
  const: 'Constant',
  interface: 'Interface',
  class: 'Class',
  function: 'Function',
  'type-alias': 'Type',
};

const rxjsRp = requestPromise.defaults({
  baseUrl: 'https://rxjs-dev.firebaseapp.com',
  json: true,
});

async function loadSources(stylePath: string) {
  if (sources) {
    return sources;
  }

  await persistStyle(stylePath);

  let [prettierJs, codeBuildHtml, hrefReplaceHtml] = await Promise.all([
    fs.readFile(pathResolve(__dirname, 'assets/prettify.js'), { encoding: 'utf8' }),
    fs.readFile(pathResolve(__dirname, 'assets/code-build.html'), { encoding: 'utf8' }),
    fs.readFile(pathResolve(__dirname, 'assets/href-replace.html'), { encoding: 'utf8' }),
  ]);

  sources = { prettierJs, codeBuildHtml, hrefReplaceHtml };
  return sources;
}

async function getIndex() {
  return rxjsRp({
    url: '/generated/docs/api/api-list.json',
  });
}

async function getDetail(path: string) {
  let { contents } = await rxjsRp({ url: `/generated/docs/${path.replace(/html$/, 'json')}` });
  return contents;
}

function getDepthStr(filePath: string) {
  let depth = filePath.replace(/.*\/api\//, '').split('/').length;
  // tslint:disable-next-line: prefer-array-literal
  let depthStr = new Array(depth).fill('..').join('/');
  return depthStr;
}

async function replaceImagePath(dirStruct: string, depthStr: string, contents: string) {
  let matches = contents.match(/(assets\/images\/[^"]+)/gi);
  if (!matches) {
    return contents;
  }

  await Promise.all(
    matches.map(async (imagePath) => {
      let url = `https://rxjs-dev.firebaseapp.com/${imagePath}`;

      let path = pathResolve(dirStruct, imagePath);
      await fs.ensureFile(path);

      request({ url }).pipe(fs.createWriteStream(path));
    })
  );

  return contents.replace(/(\/assets\/images\/[^"]+)/gi, `${depthStr}/$1`);
}

async function buildApiHtml(dirStruct: string, { title, path }: ApiItem) {
  let { prettierJs, codeBuildHtml, hrefReplaceHtml } = sources;

  console.info(`request for ${title} at ${path}`);
  let article = await getDetail(path);
  let filePath = pathResolve(dirStruct, `${path}`);
  let depthStr = getDepthStr(filePath);

  console.info(`build for ${title} at ${path}`);
  article = await replaceImagePath(dirStruct, depthStr, article);

  let content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>dash-rxjs:6</title>
  <link rel="stylesheet" href="${depthStr}/assets/style.css"></head>

  <style>
  article {
    margin: 0 30px;
  }
  .page-actions {
      display: none;
  }
  .breadcrumb {
      display: none;
  }
  </style>
</head>
<body>
  ${article}
  ${hrefReplaceHtml}

<script>${prettierJs}</script>
  ${codeBuildHtml}
</body>
</html>
`;

  let { dir } = pathParse(filePath);
  await fs.ensureDir(dir);

  await fs.writeFile(filePath, content);
}

async function buildDbIndex(dbPath: string, apiItems: ApiItem[]) {
  let arr: DashApi[] = [];
  apiItems.forEach(({ title, docType, path }) => {
    arr.push({
      path,
      type: typeMap[docType],
      name: title,
    });
  });

  await createDatabase(arr, dbPath);
}

async function buildApi(
  dbPath: string,
  dirStruct: string,
  stylePath: string,
) {
  await loadSources(stylePath);

  console.info('request api index');
  let arr: ApiGroup[] = await getIndex();
  let apiItems: ApiItem[] = [];
  arr.forEach((item) => {
    apiItems.push(...item.items);
  });

  apiItems.forEach((item) => {
    item.path += '.html';
  });

  console.info('build db index');
  await buildDbIndex(dbPath, apiItems);

  await bbMap(
    apiItems,
    (apiItem) => {
      return buildApiHtml(dirStruct, apiItem);
    },
    { concurrency: 10 }
  );
}

export { ApiGroup, ApiItem, TypeMap, buildApi };
