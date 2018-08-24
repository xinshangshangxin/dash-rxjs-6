import * as fs from 'fs-extra';
import { resolve as pathResolve } from 'path';

import { buildApi } from './build-api';

const DOC_NAME = 'rxjs6';
const DOC_ROOT_DIR = pathResolve(__dirname, DOC_NAME);

const docsetDir = `${DOC_ROOT_DIR}.docset`;
const resourcesDir = `${docsetDir}/Contents/Resources/`;
const plistPath = `${docsetDir}/Contents/Info.plist`;
const dbPath = `${docsetDir}/Contents/Resources/docSet.dsidx`;
const dirStruct = `${docsetDir}/Contents/Resources/Documents/`;
const iconPath = `${docsetDir}/icon.png`;

async function buildInfoPlist() {
  let plistInfo = await fs.readFile(pathResolve(__dirname, 'assets', 'Info.plist'), {
    encoding: 'utf8',
  });
  plistInfo = plistInfo.replace(/DOC_NAME/gi, DOC_NAME);
  await fs.writeFile(plistPath, plistInfo);
}

async function copyResource() {
  await fs.copy(pathResolve(__dirname, 'assets', 'icon.png'), iconPath);
  await buildInfoPlist();
}

async function clean() {
  console.info('========= do clean =========');
  try {
    await fs.remove(docsetDir);
  } catch (e) {
    console.warn(e);
  }
}

async function init() {
  console.log(`mkdir -p ${resourcesDir}`);
  await clean();
  await fs.ensureDir(resourcesDir);

  console.log('build resources...');
  await copyResource();

  console.info('build documents');
  await buildApi(dbPath, dirStruct);
}

export { init, clean };
