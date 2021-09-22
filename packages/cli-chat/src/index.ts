//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { ChatModule } from './modules/chat';

import { readFileSync } from 'fs';
import path from 'path';

module.exports = createCLI({
  modules: [ChatModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString()
});
