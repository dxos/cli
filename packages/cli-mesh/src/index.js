//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { MeshModule } from './modules/mesh';

import info from '../extension.yml';

module.exports = createCLI({
  modules: [MeshModule],
  dir: __dirname,
  main: !module.parent,
  info
});
