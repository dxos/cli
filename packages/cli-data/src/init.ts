//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import defaultsDeep from 'lodash.defaultsdeep';
import os from 'os';

import { CoreState } from '@dxos/cli-core';
import { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { createKeyPair, keyToBuffer } from '@dxos/crypto';

import { CLI_DEFAULT_PERSISTENT, getProfileAndStorage } from './config';
import { StateManager } from './state-manager';
import { createClient } from './create-client';

export interface CliDataState extends CoreState {
  stateManager: StateManager
}

let stateManager: StateManager;
export const initDataCliState = async (state: CoreState): Promise<CliDataState> => {
  const { config, getReadlineInterface, models, profilePath, profileExists } = state;
  assert(config, 'Missing config.');

  if (!profilePath || !profileExists) {
    throw new Error('CLI profile does not exist.');
  }

  const { storagePath, profileName } = getProfileAndStorage(config.get('cli.storage.path'), profilePath);
  const persistent = config.get('cli.storage.persistent', CLI_DEFAULT_PERSISTENT);

  assert(getReadlineInterface, 'Missing getReadlineinterface.');
  stateManager = new StateManager({
    getClient: (opts) => createClient(config, models ?? [], { persistent, storagePath, profileName, initProfile: opts?.initProfile ?? true }),
    getReadlineInterface, 
    storagePath: persistent ? storagePath : undefined
  });

  // The `cli-core` expects the state to be modified.
  // Issue: https://github.com/dxos/cli/issues/246
  (state as CliDataState).stateManager = stateManager;

  return {
    ...state,
    stateManager
  };
};

export const destroyDataCliState = async () => {
  if (stateManager) {
    await stateManager.destroy();
  }
};
