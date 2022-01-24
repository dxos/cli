//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';

import { Params } from './common';

export const createAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, startAmount } = argv;
  assert(!/[A-Z]/g.test(name), 'Name could not contain capital letters.');

  assert(startAmount >= 0, 'Amount must be positive integer number.');

  const client = await getDXNSClient();
  await client.auctionsClient.createAuction(name, startAmount);
};

export const bidAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, amount } = argv;
  assert(!/[A-Z]/g.test(name), 'Name could not contain capital letters.');

  assert(amount >= 0, 'Amount must be positive integer number.');

  const client = await getDXNSClient();
  await client.auctionsClient.bidAuction(name, amount);
};

export const closeAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name } = argv;
  assert(!/[A-Z]/g.test(name), 'Name could not contain capital letters.');

  const client = await getDXNSClient();
  await client.auctionsClient.closeAuction(name);
};

export const forceCloseAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, mnemonic } = argv;
  assert(!/[A-Z]/g.test(name), 'Name could not contain capital letters.');

  const client = await getDXNSClient();
  const { keyring, transactionHandler, apiRaw } = client;

  const sudoer = keyring.addFromUri(mnemonic.join(' '));
  await transactionHandler.sendSudoTransaction(apiRaw.tx.registry.forceCloseAuction(name), sudoer);
};

export const claimAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, json } = argv;

  assert(!/[A-Z]/g.test(name), 'Name could not contain capital letters.');
  const client = await getDXNSClient();

  const domainKey = await client.auctionsClient.claimAuction(name);

  print({ domainKey: domainKey.toHex() }, { json });
};

export const listAuctions = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const auctions = await client.auctionsClient.listAuctions();

  print(auctions, { json });
};
