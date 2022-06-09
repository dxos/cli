//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import debug from 'debug';

import { CoreState, createClient as createDxosClient } from '@dxos/cli-core';
import type { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { AccountClient, AccountKey, ApiTransactionHandler, AuctionsClient, createApiPromise, createKeyring, ClientSigner, RegistryClient, SignTxFunction, PolkadotRegistryClientBackend } from '@dxos/registry-client';

import { DXNSClient } from './interfaces';
import { DXNS_ACCOUNT_PREFERENCE, DXNS_ADDRESS_PREFERENCE } from './utils';

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
  const dxosClient = await getDxosClient(config);

  if (profilePath && profileExists) {
    // The keyring need to be created AFTER api is created or we need to wait for WASM init.
    // https://polkadot.js.org/docs/api/start/keyring#creating-a-keyring-instance
    const keyring = await createKeyring();
    const accountUri = config.get('runtime.services.dxns.accountUri');
    const keypair = accountUri ? keyring.addFromUri(accountUri) : undefined;
    const polkadotAddress = config.get('runtime.services.dxns.address') ??
      await dxosClient.halo.getDevicePreference(DXNS_ADDRESS_PREFERENCE);

    const apiServerUri = config.get('runtime.services.dxns.server');
    assert(apiServerUri, 'Missing DXNS endpoint config at `runtime.services.dxns.server`');
    const apiPromise = await createApiPromise(apiServerUri);

    let signFn: SignTxFunction;
    if (keypair) {
      log('Deprecated: Transactions will be signed with account from accountUri in your CLI profile.');
      signFn = tx => tx.signAsync(keypair);
    } else if (polkadotAddress) {
      log('Transactions will be signed using DXNS key stored in Halo.');
      log('Using Polkadot Address: ', polkadotAddress);
      const clientSigner = new ClientSigner(dxosClient, apiPromise.registry, polkadotAddress);
      signFn = tx => tx.signAsync(polkadotAddress, { signer: clientSigner });
    } else {
      log('No DXNS keys to sign transactions with - only read transactions available.');
      signFn = tx => tx;
    }

    const registryClient = new RegistryClient(new PolkadotRegistryClientBackend(apiPromise, signFn));
    const auctionsClient = new AuctionsClient(apiPromise, signFn);
    const accountClient = new AccountClient(apiPromise, signFn);
    const transactionHandler = new ApiTransactionHandler(apiPromise, signFn);

    const getDXNSAccount = async (argv?: any) => {
      if (argv?.account) {
        return AccountKey.fromHex(argv.account);
      }
      const account = config.get('runtime.services.dxns.account') ??
        await dxosClient.halo.getGlobalPreference(DXNS_ACCOUNT_PREFERENCE);
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
      getDXNSAccount,
      dxnsAddress: keypair?.address ?? polkadotAddress
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
