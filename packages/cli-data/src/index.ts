//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';

import { destroyDataCliState, initDataCliState, CliDataState } from './init';
import { PartyModule } from './modules/party';
import { StorageModule } from './modules/storage';

const CLI_BASE_COMMAND = 'dx';

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

export { CliDataState }

export default createCLI({
  options: CLI_CONFIG,
  modules: [PartyModule, StorageModule],
  dir: __dirname,
  main: !module.parent,
  init: initDataCliState,
  destroy: destroyDataCliState,
  info: readFileSync(path.join(__dirname, './extension.yml')).toString()
});


