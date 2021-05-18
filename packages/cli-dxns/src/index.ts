//
// Copyright 2020 DXOS.org
//

import path from 'path';
import { readFileSync } from 'fs';

import { createCLI } from '@dxos/cli-core';

import { DXNSModule } from './modules/dxns';

module.exports = createCLI({
  modules: [DXNSModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, './extension.yml')).toString(),
  compose: readFileSync(path.join(__dirname, './docker-compose.yml')).toString()
});
