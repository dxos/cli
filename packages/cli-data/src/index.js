//
// Copyright 2020 Wireline, Inc.
//

import defaultsDeep from 'lodash.defaultsdeep';
import ram from 'random-access-memory';
import os from 'os';

import { createClient } from '@dxos/data-client';
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
  const keyRing = new Keyring();
  // TODO(dboreham): Allow seed phrase to be supplied by the user.
  // const identityKeyPair = keyPairFromSeedPhrase(seedPhrase);
  // await keyRing.addKeyRecord({ ...identityKeyPair, type: KeyType.IDENTITY });
  await keyRing.createKeyRecord({ type: KeyType.IDENTITY });
  const dataClient = await createClient(ram, keyRing, config);
  // TODO(dboreham): Allow the user to specify identityDisplayName and deviceDisplayName.
  if (dataClient.partyManager.identityManager.hasIdentity()) {
    const hasHalo = await dataClient.partyManager.identityManager.isInitialized();
    if (!hasHalo) {
      await dataClient.partyManager.identityManager.initializeForNewIdentity({
        identityDisplayName: `DxOS CLI - ${os.userInfo().username}`,
        deviceDisplayName: `DxOS CLI - ${os.userInfo().username} - default device`
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
