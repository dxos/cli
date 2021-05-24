//
// Copyright 2020 DXOS.org
//

import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';
import { RegistryApi, AuctionsApi, definitions } from '@dxos/registry-api';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';

import { DXNSModule } from './modules/dxns';

export interface DXNSClient {
  api: any,
  keyring: Keyring,
  keypair: any,
  registryApi: RegistryApi,
  auctionsApi: AuctionsApi
}

const getApi = async (config: any) => {
  // Initialise the provider to connect to the node.
  const provider = new WsProvider(config.get('services.dxns.server'));

  // Extract all types from definitions - fast and dirty approach, flatted on 'types'.
  const types = Object.values(definitions).reduce((res, { types }): object => ({ ...res, ...types }), {});

  // Create the API and wait until ready.
  return await ApiPromise.create({ provider, types });
};

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
    const api = await getApi(config);

    // The keyring need to be created AFTER api is created.
    // https://polkadot.js.org/docs/api/start/keyring#creating-a-keyring-instance
    const keyring = new Keyring({ type: 'sr25519' });

    const uri = config.get('services.dxns.uri');
    const keypair = uri ? keyring.addFromUri(uri) : undefined;

    const registryApi = new RegistryApi(api, keypair);
    const auctionsApi = new AuctionsApi(api, keypair);

    return {
      api,
      keyring,
      keypair: keypair,
      registryApi,
      auctionsApi
    };
  }
};

const initDXNSCliState = async (state: any) => {
  const { config, profilePath, profileExists } = state;

  if (profilePath && profileExists) {
    const getDXNSClient = createClientGetter(config, { profilePath, profileExists });
    state.getDXNSClient = getDXNSClient;
  }
};

const destroyDXNSCliState = async () => {
  if (client) {
    await client.api.disconnect();
  }
}

module.exports = createCLI({
  modules: [DXNSModule],
  dir: __dirname,
  main: !module.parent,
  init: initDXNSCliState,
  destroy: destroyDXNSCliState,
  info: readFileSync(path.join(__dirname, './extension.yml')).toString(),
  compose: readFileSync(path.join(__dirname, './docker-compose.yml')).toString()
});
