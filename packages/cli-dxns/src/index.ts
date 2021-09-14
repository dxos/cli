//
// Copyright 2020 DXOS.org
//

import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';
import { ApiFactory, IAuctionsApi, IRegistryApi, ApiTransactionHandler } from '@dxos/registry-api';

import { DXNSModule } from './modules/dxns';

export interface DXNSClient {
  apiRaw: ApiPromise,
  keyring: Keyring,
  keypair?: KeyringPair,
  registryApi: IRegistryApi,
  auctionsApi: IAuctionsApi,
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
    const keyring = new Keyring({ type: 'sr25519' });
    await cryptoWaitReady();

    const uri = config.get('services.dxns.uri');
    const keypair = uri ? keyring.addFromUri(uri) : undefined;
    // TODO(marcin): fix config substitution.
    const apiServerUri = config.get('ws://127.0.0.1:9944');
    const registryApi = await ApiFactory.createRegistryApi(apiServerUri, keypair);
    const { auctionsApi, apiPromise } = await ApiFactory.createAuctionsApi(apiServerUri, keypair);
    const transactionHandler = new ApiTransactionHandler(apiPromise, keypair);

    return {
      apiRaw: apiPromise,
      keyring,
      keypair,
      registryApi,
      auctionsApi,
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
    await client.registryApi.disconnect();
    await client.auctionsApi.disconnect();
  }
};

module.exports = createCLI({
  modules: [DXNSModule],
  dir: __dirname,
  main: !module.parent,
  init: initDXNSCliState,
  destroy: destroyDXNSCliState,
  info: readFileSync(path.join(__dirname, './extension.yml')).toString(),
  compose: readFileSync(path.join(__dirname, './docker-compose.yml')).toString()
});
