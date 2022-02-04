//
// Copyright 2021 DXOS.org
//

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto';

import { sleep } from '@dxos/async';
import { print } from '@dxos/cli-core';

import { Params } from './common';
import assert from 'assert';

export const generateAccount = () => async (argv: any) => {
  const { json } = argv;

  await cryptoWaitReady();
  const mnemonic = mnemonicGenerate();

  const keyring = new Keyring({ type: 'sr25519' });
  const { address } = await keyring.addFromUri(mnemonic);

  print({ mnemonic, address }, { json });
};

export const listAccounts = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();
  const { json } = argv;
  const account = client.keypair?.address;

  print({ account }, { json });

  await sleep(2000);
};

export const recoverAccount = ({getDXNSClient, stateManager}: Params) => async (argv: any) => {
  const { mnemonic } = argv;
  assert(mnemonic, 'Mnemonic is required');

  const dxnsClient = await getDXNSClient();
  const dxosClient = await stateManager.getClient();
  // dxosClient.halo
  // await dxosClient.halo.
}
