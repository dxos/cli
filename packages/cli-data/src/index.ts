//
// Copyright 2020 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';
import os from 'os';

import { createCLI } from '@dxos/cli-core';
import { Client, ClientConfig } from '@dxos/client';
import { keyToBuffer, createKeyPair } from '@dxos/crypto';

import { CLI_DEFAULT_PERSISTENT, getProfileAndStorage } from './config';
import info from './extension';
import { PartyModule } from './modules/party';
import { StorageModule } from './modules/storage';
import { StateManager } from './state-manager';

const CLI_BASE_COMMAND = 'dx';

const CLI_CONFIG = {
  prompt: CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

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

  if (!dataClient.getProfile()) {
    // TODO(dboreham): Allow seed phrase to be supplied by the user.
    const { publicKey, secretKey } = createKeyPair();
    const username = `cli:${os.userInfo().username}:${profileName}`;

    await dataClient.createProfile({ publicKey, secretKey, username });
  }

  // Register models from other extensions.
  // eslint-disable-next-line
  for await (const model of models) {
    dataClient.registerModel(model);
  }

  return dataClient;
};

let client: Client;
const createClientGetter = (config: ClientConfig, models: any[], options: any) => async () => {
  if (!client) {
    client = await _createClient(config, models, options);
  }
  return client;
};

let stateManager: StateManager;

const initDataCliState = async (state: any) => {
  const { config, getReadlineInterface, models, profilePath, profileExists } = state;

  if (profilePath && profileExists) {
    const { storagePath, profileName } = getProfileAndStorage(config.get('cli.storage.path'), profilePath);
    const persistent = config.get('cli.storage.persistent', CLI_DEFAULT_PERSISTENT);

    const getClient = await createClientGetter(config, models, { persistent, storagePath, profileName });

    stateManager = new StateManager(getClient, getReadlineInterface, {
      storagePath: persistent ? storagePath : undefined
    });

    state.getClient = getClient;
    state.stateManager = stateManager;
  }
};

const destroyDataCliState = async () => {
  if (client) {
    await client.destroy();
  }
  if (stateManager) {
    await stateManager.destroy();
  }
};

module.exports = createCLI({
  options: CLI_CONFIG,
  modules: [PartyModule, StorageModule],
  dir: __dirname,
  main: !module.parent,
  init: initDataCliState,
  destroy: destroyDataCliState,
  info
});
