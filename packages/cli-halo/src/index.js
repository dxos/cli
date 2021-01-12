//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { HaloModule } from './modules/halo';

import info from '../extension.yml';

module.exports = createCLI({
  modules: [HaloModule],
  dir: __dirname,
  main: !module.parent,
  info
});
