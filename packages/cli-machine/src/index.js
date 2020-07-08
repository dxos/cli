//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { MachineModule } from './modules/machine';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [MachineModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
