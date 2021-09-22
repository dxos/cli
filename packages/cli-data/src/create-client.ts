//
// Copyright 2020 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';
import os from 'os';

import { Client } from '@dxos/client';
import { createKeyPair, keyToBuffer } from '@dxos/crypto';

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
  for (const model of models) {
    dataClient.registerModel(model);
  }

  return dataClient;
};
