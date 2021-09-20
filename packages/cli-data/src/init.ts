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

const _createClient = async (config: any, models: any[], options: any) => {
  const { client = {}, services: { signal: { server }, ice }, cli } = config.values;
  const { storagePath, persistent, profileName } = options;

  const clientConf = {
    swarm: {
      signal: server,
      ice
    },
    session: {
      peerId: keyToBuffer(cli.peerId)
    }
  };
  config = defaultsDeep({}, clientConf, client);

  const dataClient = new Client({
    swarm: config.swarm,
    storage: {
      persistent,
      path: persistent ? storagePath : undefined
    }
  });

  await dataClient.initialize();

  if (!dataClient.halo.getProfile()) {
    // TODO(dboreham): Allow seed phrase to be supplied by the user.
    const username = `cli:${os.userInfo().username}:${profileName}`;

    await dataClient.halo.createProfile({ ...createKeyPair(), username });
  }

  // Register models from other extensions.
  // eslint-disable-next-line
  for await (const model of models) {
    dataClient.registerModel(model);
  }

  return dataClient;
};

let client: Client;
const createClientGetter = (config: Config, models: any[], options: any) => async () => {
  if (!client) {
    client = await _createClient(config, models, options);
  }
  return client;
};

export interface CliDataState extends CoreState {
  getClient: Function,
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

  const getClient = await createClientGetter(config, models ?? [], { persistent, storagePath, profileName });

  assert(getReadlineInterface, 'Missing getReadlineinterface.');
  stateManager = new StateManager(getClient, getReadlineInterface, {
    storagePath: persistent ? storagePath : undefined
  });

  // The `cli-core` expects the state to be modified.
  // Issue: https://github.com/dxos/cli/issues/246
  (state as CliDataState).getClient = getClient;
  (state as CliDataState).stateManager = stateManager;

  return {
    ...state,
    getClient,
    stateManager
  };
};

export const destroyDataCliState = async () => {
  if (client) {
    await client.destroy();
  }
  if (stateManager) {
    await stateManager.destroy();
  }
};
