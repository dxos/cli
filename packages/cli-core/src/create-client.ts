//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import os from 'os';

import { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { createKeyPair } from '@dxos/crypto';

import { getCurrentProfilePath, getClientProfilePath, saveCurrentProfilePath } from './util/profile';

type CreateClientOptions = {
  persistent: boolean,
  initProfile: boolean,
  name?: string
}

export const createClient = async (
  config: any,
  models: any[],
  options: CreateClientOptions
) => {
  const { persistent, name, initProfile } = options;

  let storagePath;
  if (name) {
    storagePath = getClientProfilePath(config.get('runtime.client.storage.path'), name);
    saveCurrentProfilePath(storagePath);
  }

  if (!storagePath) {
    storagePath = getCurrentProfilePath();
  }

  assert(storagePath, 'No active HALO profile found. Run "dx halo init" to init a new profile.');

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

  if (initProfile) {
    if (dataClient.halo.getProfile()) {
      throw new Error(`Profile "${name}" already exists!`);
    }
    // TODO(dboreham): Allow seed phrase to be supplied by the user.
    const username = `cli:${os.userInfo().username}:${name}`;

    await dataClient.halo.createProfile({ ...createKeyPair(), username });
  }

  // Register models from other extensions.
  for (const model of models) {
    dataClient.registerModel(model);
  }

  return dataClient;
};
