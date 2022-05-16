//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import os from 'os';

import { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { createKeyPair } from '@dxos/crypto';
import { ClientSignerAdapter } from '@dxos/registry-client';

import { CLI_DEFAULT_PERSISTENT, getCurrentProfilePath, getClientProfilePath, saveCurrentProfilePath } from './utils';

// TODO(burdon): Replace with def from @dxos/client once published.
type Model = any;

export type CreateClientOptions = {
  initProfile: boolean
  name?: string
}

export const createClient = async (
  config: any,
  models: Model[],
  options: CreateClientOptions
) => {
  const { name, initProfile } = options;

  let storagePath;
  if (name) {
    storagePath = getClientProfilePath(undefined, name);
    saveCurrentProfilePath(storagePath);
  }
  if (!storagePath) {
    const currentStoragePath = getCurrentProfilePath();
    storagePath = currentStoragePath ?? getClientProfilePath(config.get('runtime.client.storage.path'));
  }
  assert(storagePath, 'No active HALO profile found. Run "dx halo init" to init a new profile.');

  const persistent = config.get('runtime.client.storage.persistent', CLI_DEFAULT_PERSISTENT)!;

  const clientConf = new Config(config.values, {
    version: 1,
    runtime: {
      client: {
        storage: {
          persistent,
          path: persistent ? storagePath : undefined
        }
      }
    }
  });

  const client = new Client(clientConf, {
    signer: new ClientSignerAdapter()
  });

  await client.initialize();

  if (initProfile) {
    if (client.halo.profile) {
      throw new Error(`Profile "${name}" already exists.`);
    }

    // TODO(dboreham): Allow seed phrase to be supplied by the user.
    const username = `cli:${os.userInfo().username}:${name}`;
    await client.halo.createProfile({ ...createKeyPair(), username });
  }

  // Register models from other extensions.
  for (const model of models) {
    client.registerModel(model);
  }

  return client;
};
