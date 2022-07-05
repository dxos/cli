//
// Copyright 2020 DXOS.org
//

import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import { CoreState } from '@dxos/cli-core';
import type { Client } from '@dxos/client';
import { Config } from '@dxos/config';
import { AccountsClient, AccountKey, ApiTransactionHandler, AuctionsClient, RegistryClient } from '@dxos/registry-client';

export interface DXNSClient {
  apiRaw: ApiPromise,
  keyring: Keyring,
  keypair?: KeyringPair,
  registryClient: RegistryClient,
  auctionsClient: AuctionsClient,
  accountClient: AccountsClient,
  transactionHandler: ApiTransactionHandler,
  dxosClient: Client,
  dxnsAddress: string | undefined,
  getDXNSAccount: (argv?: any) => Promise<AccountKey>
}

export interface Params extends CoreState {
  config: Config,
  getDXNSClient(force?: boolean): Promise<DXNSClient>
  notVoid: boolean
}
