//
// Copyright 2020 DXOS.org
//

import os from 'os';

import { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { createKeyPair } from '@dxos/crypto';

type CreateClientOptions = {
  storagePath: string,
  persistent: boolean,
  profileName: string,
  initProfile: boolean
}

const _createClient = async (config: any, options: CreateClientOptions): Promise<Client> => {
  // TODO - get storagePath right here from ./config
  const { storagePath, persistent } = options;

  // TODO(egorgripasov): Cleanup (config.values.runtime -> config.values) - Adapter to config v0.
  const clientConf = new Config(config.values.runtime, {
    system: {
      storage: {
        persistent,
        path: persistent ? storagePath : undefined
      }
    }
  });

  const dataClient = new Client(clientConf);

  await dataClient.initialize();
  return dataClient;
}

export const createClientProfile = async (config: any, options: CreateClientOptions) => {
  const dataClient = await _createClient(config, options);

  const { profileName } = options;

  if (!dataClient.halo.getProfile()) {
    // TODO(dboreham): Allow seed phrase to be supplied by the user.
    const username = `cli:${os.userInfo().username}:${profileName}`;

    await dataClient.halo.createProfile({ ...createKeyPair(), username });
  } else {
    throw new Error('Profile already exists.');
  }
}

export const createClient = async (config: any, models: any[], options: CreateClientOptions) => {
  const { initProfile } = options;

  const dataClient = await _createClient(config, options);
  
  if (!dataClient.halo.getProfile() && initProfile) {
    throw new Error('No active HALO profile found. Run "dx halo init" to init a new profile.');
  }

  // Register models from other extensions.
  for (const model of models) {
    dataClient.registerModel(model);
  }

  return dataClient;
};
