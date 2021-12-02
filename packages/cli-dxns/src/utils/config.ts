//
// Copyright 2021 DXOS.org
//

import fs from 'fs';
// import defaultsDeep from 'lodash.defaultsdeep';
import mapvalues from 'lodash.mapvalues';
import omit from 'lodash.omit';
import pick from 'lodash.pick';

import { DEFAULT_PACKAGE_JSON_ATTRIBUTES, PACKAGE_JSON_FILENAME, readFile, writeFile } from '@dxos/cli-core';
import { Config, ConfigV1Object } from '@dxos/config';

export const CONFIG_FILENAME = 'dx.yml';

const DEFAULT_BUILD_COMMAND = 'npm run build';

const IGNORED_CONFIG_ATTRIBUTES = ['version'];

// TODO(egorgripasov): Do we ever need to update config?
// export const updateConfig = async (config: any) => {
//   let appConfig = fs.existsSync(CONFIG_FILENAME) ? await readFile(CONFIG_FILENAME) : {};
//   dxConfig = defaultsDeep({}, config, appConfig);

//   await writeFile(dxConfig, CONFIG_FILENAME);
// };

export const loadConfig = async (): Promise<Config<ConfigV1Object>> => {
  const packageProperties = mapvalues(pick(fs.existsSync(PACKAGE_JSON_FILENAME)
    ? await readFile(PACKAGE_JSON_FILENAME)
    : {}, DEFAULT_PACKAGE_JSON_ATTRIBUTES), (value: any) => value?.url ? value.url : value);
  const dxConfig = omit(fs.existsSync(CONFIG_FILENAME)
    ? await readFile(CONFIG_FILENAME)
    : {}, IGNORED_CONFIG_ATTRIBUTES);

  return new Config<ConfigV1Object>({
    build: {
      command: DEFAULT_BUILD_COMMAND
    },
    ...dxConfig,
    ...packageProperties
  })
};
