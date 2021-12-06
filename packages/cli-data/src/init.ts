//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { CoreState } from '@dxos/cli-core';

import { CLI_DEFAULT_PERSISTENT, getProfileAndStorage } from './config';
import { createClient } from './create-client';
import { StateManager } from './state-manager';

export interface CliDataState extends CoreState {
  stateManager: StateManager
}

let stateManager: StateManager;
export const initDataCliState = async (state: CoreState): Promise<CliDataState> => {
  const { config, getReadlineInterface, models, profilePath, profileExists } = state;
  assert(config, 'Missing config.');

  if (!profilePath || !profileExists) {
    return state as CliDataState; // Do not initialize cli-data if we don't have profile.
  }

  const { storagePath, profileName } = getProfileAndStorage(config.get('runtime.client.storage.path'), profilePath);
  const persistent = config.get('runtime.client.storage.persistent', CLI_DEFAULT_PERSISTENT)!;

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
