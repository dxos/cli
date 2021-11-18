//
// Copyright 2020 DXOS.org
//

import os from 'os';

import { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { createKeyPair } from '@dxos/crypto';

export const createClient = async (
  config: any,
  models: any[],
  options: {storagePath: string, persistent: boolean, profileName: string, initProfile: boolean}
) => {
  const { storagePath, persistent, profileName, initProfile } = options;

  const clientConf = new Config(config.values, {
    system: {
      storage: {
        persistent,
        path: persistent ? storagePath : undefined
      }
    }
  });

  const dataClient = new Client(clientConf);

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
