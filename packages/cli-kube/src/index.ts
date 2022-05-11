//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { KubeModule } from './modules/kube';

module.exports = createCLI({
  modules: [KubeModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString(),
  compose: readFileSync(path.join(__dirname, '../docker-compose.yml')).toString()
});
