//
// Copyright 2021 DXOS.org
//

import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, decodeAddress, mnemonicGenerate } from '@polkadot/util-crypto';
import assert from 'assert';

import { sleep } from '@dxos/async';
import { print } from '@dxos/cli-core';
import { KeyType } from '@dxos/credentials';
import { PublicKey } from '@dxos/crypto';

import { Params } from '../interfaces';

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

export const recoverAccount = ({ getDXNSClient }: Params) => async (argv: any) => {
  const { mnemonic, json } = argv;
  assert(mnemonic, 'Mnemonic is required');
  const uri = mnemonic.join('');

  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  const keypair = keyring.addFromUri(uri);

  const { dxosClient } = await getDXNSClient();

  await dxosClient.halo.addKeyRecord({
    publicKey: PublicKey.from(decodeAddress(keypair.address)),
    secretKey: Buffer.from(uri),
    type: KeyType.DXNS
  });

  print({ account: keypair.address }, { json });
  print('Manual step required: Put the account into your config > runtime > services > dxns > account');
};
