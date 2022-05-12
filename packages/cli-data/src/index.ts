//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { destroyDataCliState, initDataCliState, CliDataState } from './init';
import { PartyModule, DeviceModule } from './modules';
import { StateManager } from './state-manager';

const CLI_BASE_COMMAND = 'dx';

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

export { CliDataState, StateManager };

export default createCLI({
  dir: __dirname,
  main: !module.parent,
  modules: [PartyModule, DeviceModule],
  init: initDataCliState,
  destroy: destroyDataCliState,
  info: readFileSync(path.join(__dirname, '../dx.yml')).toString(),
  options: CLI_CONFIG
});
