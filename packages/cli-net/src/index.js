//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { NetModule } from './modules/net';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [NetModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
