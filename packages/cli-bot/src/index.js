//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { BotModule } from './modules/bot';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [BotModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
