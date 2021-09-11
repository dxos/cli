//
// Copyright 2020 DXOS.org
//

import { Keyring } from '@polkadot/keyring';
import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';
import { IRegistryApi, IAuctionsApi, ApiFactory } from '@dxos/registry-api';

import { DXNSModule } from './modules/dxns';

export interface DXNSClient {
  keyring: Keyring,
  keypair: any,
  registryApi: IRegistryApi,
  auctionsApi: IAuctionsApi
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
    // The keyring need to be created AFTER api is created.
    // https://polkadot.js.org/docs/api/start/keyring#creating-a-keyring-instance
    const keyring = new Keyring({ type: 'sr25519' });

    const uri = config.get('services.dxns.uri');
    const keypair = uri ? keyring.addFromUri(uri) : undefined;

    const apiServerUri = config.get('services.dxns.server');
    const registryApi = await ApiFactory.createRegistryApi(apiServerUri, keypair);
    const { auctionsApi } = await ApiFactory.createAuctionsApi(apiServerUri, keypair);

    return {
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
