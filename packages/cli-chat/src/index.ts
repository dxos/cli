//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI, loadYml } from '@dxos/cli-core';

import { ChatModule } from './modules/chat';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [ChatModule],
  info: loadYml(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`))
});
