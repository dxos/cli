//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { DXNSModule } from './modules/dxns';

import info from '../extension.yml';

module.exports = createCLI({
  modules: [DXNSModule],
  dir: __dirname,
  main: !module.parent,
  info
});
