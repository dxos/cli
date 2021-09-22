//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { IPFSModule } from './modules/ipfs';

import info from '../extension.yml';

module.exports = createCLI({
  modules: [IPFSModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString()
});
