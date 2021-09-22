//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { IPFSModule } from './modules/ipfs';
import { readFileSync } from 'fs';
import path from 'path';


module.exports = createCLI({
  modules: [IPFSModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString()
});
