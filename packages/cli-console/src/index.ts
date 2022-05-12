//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { AppModule } from './modules/console';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [AppModule],
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString()
});
