//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI, loadYml } from '@dxos/cli-core';

import { destroyDXNSCliState, initDXNSCliState } from './init';
import { DXNSClient } from './interfaces';
import { DXNSModule } from './modules/dxns';

export { DXNSClient };

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [DXNSModule],
  init: initDXNSCliState,
  destroy: destroyDXNSCliState,
  info: loadYml(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`)),
  docker: loadYml(path.join(__dirname, '../docker-compose.yml'))
});
