//
// Copyright 2020 DxOS.
//

import fs from 'fs';
import defaultsDeep from 'lodash.defaultsdeep';
import pick from 'lodash.pick';

import { readFile, writeFile } from '@dxos/cli-core';

import { APP_CONFIG_FILENAME, DEFAULT_PACKAGE_JSON_ATTRIBUTES, PACKAGE_JSON_FILENAME } from '../config';

const DEFAULT_BUILD = 'yarn webpack -p';

export const updateAppConfig = async config => {
  let appConfig = fs.existsSync(APP_CONFIG_FILENAME) ? await readFile(APP_CONFIG_FILENAME) : {};
  appConfig = defaultsDeep({}, appConfig, config);

  await writeFile(appConfig, APP_CONFIG_FILENAME);
};

export const loadAppConfig = async () => {
  const packageProperties = pick(fs.existsSync(PACKAGE_JSON_FILENAME)
    ? await readFile(PACKAGE_JSON_FILENAME) : {}, DEFAULT_PACKAGE_JSON_ATTRIBUTES);
  const appConfig = fs.existsSync(APP_CONFIG_FILENAME) ? await readFile(APP_CONFIG_FILENAME) : {};

  return {
    build: DEFAULT_BUILD,
    ...packageProperties,
    ...appConfig
  };
};
