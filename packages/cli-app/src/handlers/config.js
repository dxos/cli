//
// Copyright 2020 DXOS.
//

import fs from 'fs';
import defaultsDeep from 'lodash.defaultsdeep';
import pick from 'lodash.pick';
import omit from 'lodash.omit';

import { DEFAULT_PACKAGE_JSON_ATTRIBUTES, PACKAGE_JSON_FILENAME, readFile, writeFile } from '@dxos/cli-core';

import { APP_CONFIG_FILENAME } from '../config';

const DEFAULT_BUILD = 'yarn webpack -p';

const IGNORED_APP_CONFIG_ATTRIBUTES = ['version'];

export const updateAppConfig = async config => {
  let appConfig = fs.existsSync(APP_CONFIG_FILENAME) ? await readFile(APP_CONFIG_FILENAME) : {};
  appConfig = defaultsDeep({}, config, appConfig);

  await writeFile(appConfig, APP_CONFIG_FILENAME);
};

export const loadAppConfig = async () => {
  const packageProperties = pick(fs.existsSync(PACKAGE_JSON_FILENAME)
    ? await readFile(PACKAGE_JSON_FILENAME) : {}, DEFAULT_PACKAGE_JSON_ATTRIBUTES);
  const appConfig = omit(fs.existsSync(APP_CONFIG_FILENAME)
    ? await readFile(APP_CONFIG_FILENAME) : {}, IGNORED_APP_CONFIG_ATTRIBUTES);

  return {
    build: DEFAULT_BUILD,
    ...packageProperties,
    ...appConfig
  };
};
