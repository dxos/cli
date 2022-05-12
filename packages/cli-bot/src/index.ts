//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { BotModule } from './modules/bot';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [BotModule],
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString(),
  compose: readFileSync(path.join(__dirname, '../docker-compose.yml')).toString()
});
