//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { SignalModule } from './modules/signal';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [SignalModule],
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString(),
  compose: readFileSync(path.join(__dirname, '../docker-compose.yml')).toString()
});
