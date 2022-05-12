//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI, loadYml } from '@dxos/cli-core';

import { EchoModule } from './modules/echo';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [EchoModule],
  info: loadYml(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`))
});
