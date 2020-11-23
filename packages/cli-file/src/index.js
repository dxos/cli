//
// Copyright 2020 DXOS.org
//

// TODO(burdon): Move code out of index.js

import { createCLI } from '@dxos/cli-core';

import { AppModule } from './modules/file';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [AppModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
