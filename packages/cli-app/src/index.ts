//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI, loadYml } from '@dxos/cli-core';

import { AppModule } from './modules/app';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [AppModule],
  info: loadYml(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`)),
  docker: loadYml(path.join(__dirname, '../docker-compose.yml'))
});
