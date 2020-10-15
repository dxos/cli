//
// Copyright 2020 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';
import ram from 'random-access-memory';
import os from 'os';

import { Client } from '@dxos/client';
import { createCLI } from '@dxos/cli-core';
import { keyToBuffer, createKeyPair } from '@dxos/crypto';

import { PartyModule } from './modules/party';
import { StateManager } from './state-manager';

import info from '../extension.yml';

const WIRE_CLI_BASE_COMMAND = 'wire';

const WIRE_CONFIG = {
  prompt: WIRE_CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

const _createClient = async (config, models) => {
  const { client = {}, services: { signal: { server }, ice }, cli } = config.values;
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
  // TODO(dboreham): Allow keyring to be persisted.
  // TODO(dboreham): Allow feedstore to be persisted.

  const dataClient = new Client({
    storage: ram,
    swarm: config.swarm
  });

  await dataClient.initialize();

  // TODO(dboreham): Allow seed phrase to be supplied by the user.
  const { publicKey, secretKey } = createKeyPair();
  const username = `cli:${os.userInfo().username}`;

  await dataClient.createProfile({ publicKey, secretKey, username });

  // Register models from other extensions.
  // eslint-disable-next-line
  for await (const model of models) {
    if (!dataClient.modelFactory.hasModel(model.meta.type)) {
      dataClient.modelFactory.registerModel(model);
    }
  }

  return dataClient;
};

let client;
const createClientGetter = (config, models) => async () => {
  if (!client) {
    client = await _createClient(config, models);
  }
  return client;
};

let stateManager;

const initDataCliState = async (state) => {
  const { config, getReadlineInterface, models } = state;
  const getClient = await createClientGetter(config, models);
  stateManager = new StateManager(getClient, getReadlineInterface);

  state.getClient = getClient;
  state.stateManager = stateManager;
};

const destroyDataCliState = async () => {
  if (client) {
    await client.destroy();
  }
};

module.exports = createCLI(
  {
    options: WIRE_CONFIG,
    modules: [PartyModule],
    dir: __dirname,
    main: !module.parent,
    init: initDataCliState,
    destroy: destroyDataCliState,
    info
  }
);
