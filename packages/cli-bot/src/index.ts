//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI } from '@dxos/cli-core';

import { BotModule } from './modules/bot';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [BotModule],
  info: readFileSync(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`)).toString(),
  compose: readFileSync(path.join(__dirname, '../docker-compose.yml')).toString()
});
