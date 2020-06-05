//
// Copyright 2020 DxOS.
//

import { createCLI } from '@dxos/cli-core';

import { PeerModule } from './modules/peer';

import info from '../extension.yml';

module.exports = createCLI(
  {
    modules: [PeerModule],
    dir: __dirname,
    main: !module.parent,
    info
  }
);
