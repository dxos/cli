//
// Copyright 2020 DxOS.
//

import { createCLI } from '@dxos/cli-core';

import { AppModule } from './modules/dashboard';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [AppModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
