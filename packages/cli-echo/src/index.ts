//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { EchoModule } from './modules/echo';

module.exports = createCLI({
  modules: [EchoModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString()
});
