//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { ChatModule } from './modules/chat';

import info from '../extension.yml';

module.exports = createCLI({
  modules: [ChatModule],
  dir: __dirname,
  main: !module.parent,
  info
});
