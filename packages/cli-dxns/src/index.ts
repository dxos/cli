//
// Copyright 2020 DXOS.org
//

import debug from 'debug';
import { readFileSync } from 'fs';
import path from 'path';

import { createCLI, createClient as createDxosClient } from '@dxos/cli-core';
import type { Client } from '@dxos/client';
import { ApiTransactionHandler, AuctionsClient, createApiPromise, createKeyring, DxosClientSigner, RegistryClient, SignTxFunction } from '@dxos/registry-client';

import { DXNSClient } from './interfaces';
import { DXNSModule } from './modules/dxns';

const log = debug('dxos:cli-dxns');

let dxosClient: Client | undefined;
const getDxosClient = async (config: any) => {
  if (!dxosClient) {
    dxosClient = await createDxosClient(config, [], { initProfile: false });
  }
  return dxosClient;
};

let dxnsClient: DXNSClient | undefined;
const createDxnsClientGetter = (config: any, options: any) => async () => {
  if (!dxnsClient) {
    dxnsClient = await _createDxnsClient(config, options);
  }
  return dxnsClient;
};

const _createDxnsClient = async (config: any, options: any): Promise<DXNSClient | undefined> => {
  const { profilePath, profileExists } = options;
  if (profilePath && profileExists) {
    // The keyring need to be created AFTER api is created or we need to wait for WASM init.
    // https://polkadot.js.org/docs/api/start/keyring#creating-a-keyring-instance
    const keyring = await createKeyring();
    const accountUri = config.get('runtime.services.dxns.accountUri');
    const account = config.get('runtime.services.dxns.account');
    const keypair = accountUri ? keyring.addFromUri(accountUri) : undefined;

    const apiServerUri = config.get('runtime.services.dxns.server');
    const apiPromise = await createApiPromise(apiServerUri);

    const dxosClient = await getDxosClient(config);

    let signFn: SignTxFunction;
    if (keypair) {
      log('Deprecated: Transactions will be signed with account from accountUri in your CLI profile.');
      signFn = tx => tx.signAsync(keypair);
    } else if (account) {
      log('Transactions will be signed using DXNS key stored in Halo.');
      log('Using account: ', account);
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
      transactionHandler,
      dxosClient
    };
  }
};

const initDXNSCliState = async (state: any) => {
  const { config, profilePath, profileExists } = state;

  if (profilePath && profileExists) {
    state.getDXNSClient = createDxnsClientGetter(config, { profilePath, profileExists });
  }
};

const destroyDXNSCliState = async () => {
  if (dxnsClient) {
    await dxnsClient.apiRaw.disconnect();
  }
  if (dxosClient) {
    await dxosClient.destroy();
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
