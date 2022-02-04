//
// Copyright 2020 DXOS.org
//

import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import debug from 'debug';
import { readFileSync } from 'fs';
import path from 'path';

import { createCLI } from '@dxos/cli-core';
import { createApiPromise, IAuctionsClient, IRegistryClient, ApiTransactionHandler, createKeyring, RegistryClient, AuctionsClient, SignTxFunction, DxosClientSigner } from '@dxos/registry-client';

import { DXNSModule } from './modules/dxns';

const log = debug('dxos:cli-dxns');

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
  const { profilePath, profileExists, stateManager } = options;
  if (profilePath && profileExists) {
    // The keyring need to be created AFTER api is created or we need to wait for WASM init.
    // https://polkadot.js.org/docs/api/start/keyring#creating-a-keyring-instance
    const keyring = await createKeyring();
    const accountUri = config.get('runtime.services.dxns.accountUri');
    const account = config.get('runtime.services.dxns.account');
    const keypair = accountUri ? keyring.addFromUri(accountUri) : undefined;

    const apiServerUri = config.get('runtime.services.dxns.server');
    const apiPromise = await createApiPromise(apiServerUri);

    let signFn: SignTxFunction;
    if (keypair) {
      log('Deprecated: Transactions will be signed with account from accountUri in your CLI profile.');
      signFn = tx => tx.signAsync(keypair);
    } else if (account) {
      log('Transactions will be signed using DXNS key stored in Halo.');
      log('Using account: ', account);
      const dxosClient = await stateManager.getClient();
      const dxosClientSigner = new DxosClientSigner(dxosClient, account);
      signFn = tx => tx.signAsync(account, { signer: dxosClientSigner });
    } else {
      log('No DXNS keys to sign transactions with - only read transactions available.');
      signFn = tx => tx;
    }

    const registryClient = new RegistryClient(apiPromise, signFn);
    const auctionsClient = new AuctionsClient(apiPromise, signFn);
    const transactionHandler = new ApiTransactionHandler(apiPromise, signFn);

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
  const { config, profilePath, profileExists, stateManager } = state;
  if (!stateManager) {
    throw new Error('Missing StateManager. Is cli-data extension installed?');
  }

  if (profilePath && profileExists) {
    state.getDXNSClient = createClientGetter(config, { profilePath, profileExists, stateManager });
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
