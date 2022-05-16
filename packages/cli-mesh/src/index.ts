//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI, loadYml } from '@dxos/cli-core';

import { MeshModule } from './modules/mesh';

module.exports = createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [MeshModule],
  info: loadYml(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`))
});
