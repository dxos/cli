//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI, loadYml } from '@dxos/cli-core';

import { IPFSModule } from './modules/ipfs';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [IPFSModule],
  info: loadYml(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`))
});
