//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { IPFSModule } from './modules/ipfs';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [IPFSModule],
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString()
});
