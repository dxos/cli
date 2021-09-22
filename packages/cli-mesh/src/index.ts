//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { MeshModule } from './modules/mesh';
import { readFileSync } from 'fs';
import path from 'path';



module.exports = createCLI({
  modules: [MeshModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString()
});
