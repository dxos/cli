//
// Copyright 2020 DxOS.
//

import { createCLI } from '@dxos/cli-core';

import { ResourceModule } from './modules/resource';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [ResourceModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
