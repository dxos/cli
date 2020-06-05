//
// Copyright 2020 Wireline, Inc.
//

import { createCLI } from '@dxos/cli-core';

import { KeysModule } from './modules/keys';
import { WNSModule } from './modules/wns';
import { FaucetModule } from './modules/faucet';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [KeysModule, WNSModule, FaucetModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
