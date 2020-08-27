//
// Copyright 2020 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';
import ram from 'random-access-memory';
import os from 'os';

import { Client } from '@dxos/client';
import { createCLI } from '@dxos/cli-core';
import { keyToBuffer } from '@dxos/crypto';
import { Keyring, KeyType } from '@dxos/credentials';

import { PartyModule } from './modules/party';
import { StateManager } from './state-manager';

import info from '../extension.yml';

const WIRE_CLI_BASE_COMMAND = 'wire';

const WIRE_CONFIG = {
  prompt: WIRE_CLI_BASE_COMMAND,
  baseCommand: '',
  enableInteractive: true
};

const _createClient = async (config) => {
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
  const keyring = new Keyring();
  // TODO(dboreham): Allow seed phrase to be supplied by the user.
  // const identityKeyPair = keyPairFromSeedPhrase(seedPhrase);
  // await keyring.addKeyRecord({ ...identityKeyPair, type: KeyType.IDENTITY });
  await keyring.createKeyRecord({ type: KeyType.IDENTITY });

  const dataClient = new Client({
    storage: ram,
    swarm: config.swarm,
    keyring
  });

  await dataClient.initialize();

  // TODO(dboreham): Allow the user to specify identityDisplayName and deviceDisplayName.
  if (dataClient.partyManager.identityManager.hasIdentity()) {
    const hasHalo = await dataClient.partyManager.identityManager.isInitialized();
    if (!hasHalo) {
      await dataClient.partyManager.identityManager.initializeForNewIdentity({
        identityDisplayName: `cli:${os.userInfo().username}`,
        deviceDisplayName: `cli:${os.userInfo().username} - default device`
      });
    }
  }
  return dataClient;
};

let client;
const createClientGetter = (config) => async () => {
  if (!client) {
    client = await _createClient(config);
  }
  return client;
};

let stateManager;

const initDataCliState = async (state) => {
  const { config, getReadlineInterface } = state;
  const getClient = await createClientGetter(config);
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
