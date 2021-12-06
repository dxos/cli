//
// Copyright 2020 DXOS.org
//

import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';
import { createApiPromise, IAuctionsClient, IRegistryClient, ApiTransactionHandler, createKeyring, RegistryClient, AuctionsClient } from '@dxos/registry-client';

import { DXNSModule } from './modules/dxns';

export interface DXNSClient {
  apiRaw: ApiPromise,
  keyring: Keyring,
  keypair?: KeyringPair,
  registryClient: IRegistryClient,
  auctionsClient: IAuctionsClient,
  transactionHandler: ApiTransactionHandler
}

let client: DXNSClient | undefined;
const createClientGetter = (config: any, options: any) => async () => {
  if (!client) {
    client = await _createClient(config, options);
  }
  return client;
};

const _createClient = async (config: any, options: any): Promise<DXNSClient | undefined> => {
  const { profilePath, profileExists } = options;
  if (profilePath && profileExists) {
    // The keyring need to be created AFTER api is created or we need to wait for WASM init.
    // https://polkadot.js.org/docs/api/start/keyring#creating-a-keyring-instance
    const keyring = await createKeyring();
    const accountUri = config.get('runtime.services.dxns.accountUri');
    const keypair = accountUri ? keyring.addFromUri(accountUri) : undefined;

    const apiServerUri = config.get('runtime.services.dxns.server');
    const apiPromise = await createApiPromise(apiServerUri);

    const registryClient = new RegistryClient(apiPromise, keypair);
    const auctionsClient = new AuctionsClient(apiPromise, keypair);
    const transactionHandler = new ApiTransactionHandler(apiPromise, keypair);

    return {
      apiRaw: apiPromise,
      keyring,
      keypair,
      registryClient,
      auctionsClient,
      transactionHandler
    };
  }
};

const initDXNSCliState = async (state: any) => {
  const { config, profilePath, profileExists } = state;

  if (profilePath && profileExists) {
    state.getDXNSClient = createClientGetter(config, { profilePath, profileExists });
  }
};

const destroyDXNSCliState = async () => {
  if (client) {
    await client.apiRaw.disconnect();
  }
};

module.exports = createCLI({
  modules: [DXNSModule],
  dir: __dirname,
  main: !module.parent,
  init: initDXNSCliState,
  destroy: destroyDXNSCliState,
  info: readFileSync(path.join(__dirname, '../extension.yml')).toString(),
  compose: readFileSync(path.join(__dirname, '../docker-compose.yml')).toString()
});
