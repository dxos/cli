//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import fs from 'fs';
import mapvalues from 'lodash.mapvalues';
import omit from 'lodash.omit';
import pick from 'lodash.pick';
import path from 'path';

import { DEFAULT_PACKAGE_JSON_ATTRIBUTES, PACKAGE_JSON_FILENAME, readFile } from '@dxos/cli-core';
import { Config } from '@dxos/config';

export const CONFIG_FILENAME = 'dx.yml';

const DEFAULT_BUILD_COMMAND = 'npm run build';

const IGNORED_CONFIG_ATTRIBUTES = ['version'];

export const loadConfig = async (configPath: string = CONFIG_FILENAME): Promise<Config> => {
  const packageProperties = mapvalues(pick(fs.existsSync(PACKAGE_JSON_FILENAME)
    ? await readFile(PACKAGE_JSON_FILENAME)
    : {}, DEFAULT_PACKAGE_JSON_ATTRIBUTES), (value: any) => value?.url ? value.url : value);

  assert(fs.existsSync(configPath), `"${configPath}" not found.`);
  const dxConfig = omit(await readFile(configPath, { absolute: path.isAbsolute(configPath) }), IGNORED_CONFIG_ATTRIBUTES);

  return new Config(
    {
      module: {
        ...packageProperties
      }
    },
    dxConfig,
    {
      build: {
        command: DEFAULT_BUILD_COMMAND
      }
    }
  );
};
