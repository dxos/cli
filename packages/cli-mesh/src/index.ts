//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { MeshModule } from './modules/mesh';

module.exports = createCLI({
  modules: [MeshModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString()
});
