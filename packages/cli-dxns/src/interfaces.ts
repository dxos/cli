//
// Copyright 2020 DXOS.org
//

import { ApiPromise } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import { CoreState } from '@dxos/cli-core';
import type { Client } from '@dxos/client';
import { ApiTransactionHandler, IAuctionsClient, IRegistryClient } from '@dxos/registry-client';

export interface DXNSClient {
  apiRaw: ApiPromise,
  keyring: Keyring,
  keypair?: KeyringPair,
  registryClient: IRegistryClient,
  auctionsClient: IAuctionsClient,
  transactionHandler: ApiTransactionHandler,
  dxosClient: Client
}

export interface Params extends CoreState {
  config: any,
  getDXNSClient(): Promise<DXNSClient>
}
