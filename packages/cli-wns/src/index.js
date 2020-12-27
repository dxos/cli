//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { FaucetModule } from './modules/faucet';
import { KeysModule } from './modules/keys';
import { RegistryModule } from './modules/registry';

import info from '../extension.yml';

module.exports = createCLI({
  modules: [KeysModule, RegistryModule, FaucetModule],
  dir: __dirname,
  main: !module.parent,
  info
});
