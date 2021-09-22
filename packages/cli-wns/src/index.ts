//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { FaucetModule } from './modules/faucet';
import { KeysModule } from './modules/keys';
import { RegistryModule } from './modules/registry';

module.exports = createCLI({
  modules: [KeysModule, RegistryModule, FaucetModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString()
});
