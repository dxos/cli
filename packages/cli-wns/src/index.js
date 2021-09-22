//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import info from '../extension.yml';
import { FaucetModule } from './modules/faucet';
import { KeysModule } from './modules/keys';
import { RegistryModule } from './modules/registry';

module.exports = createCLI({
  modules: [KeysModule, RegistryModule, FaucetModule],
  dir: __dirname,
  main: !module.parent,
  info
});
