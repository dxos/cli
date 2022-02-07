//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import os from 'os';

import { Client } from '@dxos/client';
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
  const { name, initProfile } = options;

  let storagePath;
  const currentStoragePath = getCurrentProfilePath();
  if (name) {
    storagePath = getClientProfilePath(undefined, name);
    saveCurrentProfilePath(storagePath);
  }
  if (!storagePath) {
    storagePath = currentStoragePath ?? getClientProfilePath(config.get('runtime.client.storage.path'));
  }

  assert(storagePath, 'No active HALO profile found. Run "dx halo init" to init a new profile.');

  const dataClient = new Client(config.values);

  await dataClient.initialize();

  if (initProfile) {
    if (dataClient.halo.profile) {
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
