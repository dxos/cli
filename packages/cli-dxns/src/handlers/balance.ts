//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import BN from 'bn.js';

import { print } from '@dxos/cli-core';

import { Params } from './common';

export const getBalance = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();
  const { account = client.keypair?.address, json } = argv;

  assert(account, 'Account should be provided.');

  const currentFree = (await client.apiRaw.query.system.account(account)).data.free;

  const balance = currentFree.toString();

  print({ balance }, { json });
};

export const increaseBalance = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();
  const { apiRaw, keypair, keyring, transactionHandler } = client;
  const { account = keypair?.address, amount, mnemonic, json } = argv;

  assert(account, 'Account should be provided.');
  assert(mnemonic, 'Sudoer mnemonic should be provided.');

  const sudoer = keyring.addFromUri(mnemonic.join(' '));

  const { free: previousFree, reserved: previousReserved } = (await apiRaw.query.system.account(account)).data;
  const requestedFree = previousFree.add(new BN(amount));
  const setBalanceTx = apiRaw.tx.balances.setBalance(account, requestedFree, previousReserved);

  const events = await transactionHandler.sendSudoTransaction(setBalanceTx, sudoer);
  const event = events.map((e: any) => e.event).find(apiRaw.events.balances.BalanceSet.is);
  assert(event, 'Balance has not been set.');

  const newFree = event.data[1];
  const newReserved = event.data[2];

  if (newFree.eq(requestedFree)) {
    print({
      newFree: newFree.toString(),
      newReserved: newReserved.toString()
    }, { json });
  } else {
    throw new Error('Requested free amount not received. Check if existential amount is reached.');
  }
};
