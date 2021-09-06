//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import defaultsDeep from 'lodash.defaultsdeep';
import os from 'os';
import path from 'path';

import { createCLI } from '@dxos/cli-core';
import { Client, ClientConfig } from '@dxos/client';
import { keyToBuffer, createKeyPair } from '@dxos/crypto';

import { CLI_DEFAULT_PERSISTENT, getProfileAndStorage } from './config';
import { PartyModule } from './modules/party';
import { StorageModule } from './modules/storage';
import { StateManager } from './state-manager';
import { destroyDataCliState, initDataCliState } from './init';

const CLI_BASE_COMMAND = 'dx';

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

module.exports = createCLI({
  options: CLI_CONFIG,
  modules: [PartyModule, StorageModule],
  dir: __dirname,
  main: !module.parent,
  init: initDataCliState,
  destroy: destroyDataCliState,
  info: readFileSync(path.join(__dirname, './extension.yml')).toString()
});
