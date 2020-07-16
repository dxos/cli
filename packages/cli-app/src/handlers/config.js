//
// Copyright 2020 DxOS.
//

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import { read, write } from 'node-yaml';
import defaultsDeep from 'lodash.defaultsdeep';

const update = config => async argv => {
  const { conf } = argv;

  const configFile = config.get('cli.app.serve.config', '').replace('~', os.homedir());
  assert(configFile && fs.existsSync(configFile), 'Configuration file does not exist.');

  let appConfig = await read(configFile);
  appConfig = defaultsDeep({}, conf, appConfig);

  await write(configFile, appConfig);
};

export default {
  update
};
