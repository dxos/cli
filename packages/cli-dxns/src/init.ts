//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';

import { CoreState, createClient as createDxosClient } from '@dxos/cli-core';
import type { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { AccountClient, AccountKey, ApiTransactionHandler, AuctionsClient, createApiPromise, createKeyring, DxosClientSigner, RegistryClient, SignTxFunction } from '@dxos/registry-client';

import { DXNSClient } from './interfaces';

const log = debug('dxos:cli-dxns');

let dxosClient: Client | undefined;
const getDxosClient = async (config: Config) => {
  if (!dxosClient) {
    dxosClient = await createDxosClient(config, [], { initProfile: false });
  }
  return dxosClient;
};

let dxnsClient: DXNSClient | undefined;
const createDxnsClientGetter = (config: Config, state: Partial<CoreState>) => async () => {
  if (!dxnsClient) {
    dxnsClient = await _createDxnsClient(config, state);
  }
  return dxnsClient;
};

const _createDxnsClient = async (config: Config, state: Partial<CoreState>): Promise<DXNSClient | undefined> => {
  const { profilePath, profileExists } = state;
  if (profilePath && profileExists) {
    // The keyring need to be created AFTER api is created or we need to wait for WASM init.
    // https://polkadot.js.org/docs/api/start/keyring#creating-a-keyring-instance
    const keyring = await createKeyring();
    const accountUri = config.get('runtime.services.dxns.accountUri');
    const polkadotAddress = config.get('runtime.services.dxns.polkadotAddress');
    const keypair = accountUri ? keyring.addFromUri(accountUri) : undefined;

    const apiServerUri = config.get('runtime.services.dxns.server');
    assert(apiServerUri, 'Missing DXNS endpoint config at `runtime.services.dxns.server`');
    const apiPromise = await createApiPromise(apiServerUri);

    const dxosClient = await getDxosClient(config);

    let signFn: SignTxFunction;
    if (keypair) {
      log('Deprecated: Transactions will be signed with account from accountUri in your CLI profile.');
      signFn = tx => tx.signAsync(keypair);
    } else if (polkadotAddress) {
      log('Transactions will be signed using DXNS key stored in Halo.');
      log('Using Polkadot Address: ', polkadotAddress);
      const dxosClientSigner = new DxosClientSigner(dxosClient, polkadotAddress, apiPromise.registry);
      signFn = tx => tx.signAsync(polkadotAddress, { signer: dxosClientSigner });
    } else {
      log('No DXNS keys to sign transactions with - only read transactions available.');
      signFn = tx => tx;
    }

    const registryClient = new RegistryClient(apiPromise, signFn);
    const auctionsClient = new AuctionsClient(apiPromise, signFn);
    const accountClient = new AccountClient(apiPromise, signFn);
    const transactionHandler = new ApiTransactionHandler(apiPromise, signFn);

    const getDXNSAccount = (argv?: any) => {
      if (argv.account) {
        return AccountKey.fromHex(argv.account);
      }
      const account = config.get('runtime.services.dxns.dxnsAccount');
      assert(account, 'Create a DXNS account using `dx dxns account create`');
      return AccountKey.fromHex(account);
    };

    return {
      apiRaw: apiPromise,
      keyring,
      keypair,
      registryClient,
      auctionsClient,
      accountClient,
      transactionHandler,
      dxosClient,
      getDXNSAccount
    };
  }
};

export interface CliDXNSState extends CoreState {
  getDXNSClient: ReturnType<typeof createDxnsClientGetter>
}

export const initDXNSCliState = async (state: CoreState) => {
  const { config, profilePath, profileExists } = state;
  assert(config, 'Missing config.');

  if (profilePath && profileExists) {
    (state as CliDXNSState).getDXNSClient = createDxnsClientGetter(config, { profilePath, profileExists });
  }
};

export const destroyDXNSCliState = async () => {
  if (dxnsClient) {
    await dxnsClient.apiRaw.disconnect();
  }
  if (dxosClient) {
    await dxosClient.destroy();
  }
};
