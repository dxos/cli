//
// Copyright 2020 DxOS.
//

import { createCLI } from '@dxos/cli-core';

import { MDNSModule } from './modules/mdns';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [MDNSModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
