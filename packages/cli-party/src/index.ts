//
// Copyright 2020 DXOS.org
//

import path from 'path';

import { EXTENSION_CONFIG_FILENAME, createCLI, loadYml } from '@dxos/cli-core';

import { destroyDataCliState, initDataCliState, CliDataState } from './init';
import { PartyModule, DeviceModule, EchoModule } from './modules';
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
  modules: [PartyModule, DeviceModule, EchoModule],
  init: initDataCliState,
  destroy: destroyDataCliState,
  info: loadYml(path.join(__dirname, `../${EXTENSION_CONFIG_FILENAME}`)),
  options: CLI_CONFIG
});
