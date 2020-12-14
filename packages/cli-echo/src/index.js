//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { EchoModule } from './modules/echo';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [EchoModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
