//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { KubeModule } from './modules/kube';

import info from '../extension.yml';

module.exports = createCLI({
  modules: [KubeModule],
  dir: __dirname,
  main: !module.parent,
  info
});
