//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { HaloModule } from './modules/halo';

import { readFileSync } from 'fs';
import path from 'path';

module.exports = createCLI({
  modules: [HaloModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString()
});
