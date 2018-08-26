import { map as bbMap } from 'bluebird';
import * as fs from 'fs-extra';
import { parse as pathParse, resolve as pathResolve } from 'path';
import requestPromise from 'request-promise';

import { createDatabase, DashApi } from './db';

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
  styleCss: string;
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

async function loadSources() {
  if (sources) {
    return sources;
  }

  let [styleCss, prettierJs, codeBuildHtml, hrefReplaceHtml] = await Promise.all([
    fs.readFile(pathResolve(__dirname, 'assets/style.css'), { encoding: 'utf8' }),
    fs.readFile(pathResolve(__dirname, 'assets/prettify.js'), { encoding: 'utf8' }),
    fs.readFile(pathResolve(__dirname, 'assets/code-build.html'), { encoding: 'utf8' }),
    fs.readFile(pathResolve(__dirname, 'assets/href-replace.html'), { encoding: 'utf8' }),
  ]);

  sources = { styleCss, prettierJs, codeBuildHtml, hrefReplaceHtml };
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

async function buildApiHtml(dirStruct: string, { title, path }: ApiItem) {
  let { styleCss, prettierJs, codeBuildHtml, hrefReplaceHtml } = sources;

  console.info(`request for ${title} at ${path}`);
  let article = await getDetail(path);

  console.info(`build for ${title} at ${path}`);
  let content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>dash-rxjs:6</title>
  <style>${styleCss}</style>
  <script>${prettierJs}</script>
</head>
<body>
  ${article}
  ${hrefReplaceHtml}
  ${codeBuildHtml}
</body>
</html>
`;

  let filePath = pathResolve(dirStruct, `${path}`);
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

async function buildApi(dbPath: string, dirStruct: string) {
  await loadSources();

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
    { concurrency: 50 },
  );
}

export { ApiGroup, ApiItem, TypeMap, buildApi };
