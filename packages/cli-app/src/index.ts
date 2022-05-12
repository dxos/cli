//
// Copyright 2020 DXOS.org
//

// TODO(burdon): Move code out of index.js

import { readFileSync } from 'fs';
import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI } from '@dxos/cli-core';

import { AppModule } from './modules/app';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [AppModule],
  info: readFileSync(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`)).toString(),
  compose: readFileSync(path.join(__dirname, '../docker-compose.yml')).toString()
});
