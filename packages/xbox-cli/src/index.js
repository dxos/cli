//
// Copyright 2020 DxOS.
//

import { createCLI } from '@dxos/cli-core';

import { XBoxModule } from './modules/xbox';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [XBoxModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
