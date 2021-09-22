//
// Copyright 2020 DXOS.org
//

import { createCLI } from '@dxos/cli-core';

import { SignalModule } from './modules/signal';

import info from '../extension.yml';
import compose from '../docker-compose.yml';

module.exports = createCLI({
  modules: [SignalModule],
  dir: __dirname,
  main: !module.parent,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString(),
  compose: readFileSync(path.join(__dirname, '../docker-compose.yml')).toString()
});
