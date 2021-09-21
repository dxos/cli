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

export const createClient = async (
  config: any,
  models: any[],
  options: {storagePath: string, persistent: boolean, profileName: string, initProfile: boolean}
  ) => {
  const { client = {}, services: { signal: { server }, ice }, cli } = config.values;
  const { storagePath, persistent, profileName, initProfile } = options;

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

  if (!dataClient.halo.getProfile() && initProfile) {
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
