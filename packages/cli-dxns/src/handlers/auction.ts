//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';

import { Params } from './common';

export const createAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, startAmount } = argv;

  assert(startAmount >= 0, 'Amount must be positive integer number.');

  const client = await getDXNSClient();
  await client.auctionsApi.createAuction(name, startAmount);
};

export const bidAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, amount } = argv;

  assert(amount >= 0, 'Amount must be positive integer number.');

  const client = await getDXNSClient();
  await client.auctionsApi.bidAuction(name, amount);
};

export const closeAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name } = argv;

  const client = await getDXNSClient();
  await client.auctionsApi.closeAuction(name);
};

export const forceCloseAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, mnemonic } = argv;

  const client = await getDXNSClient();
  const { keyring, transactionHandler, apiRaw } = client;

  const sudoer = keyring.addFromUri(mnemonic.join(' '));
  await transactionHandler.sendSudoTransaction(apiRaw.tx.registry.forceCloseAuction(name), sudoer);
};

export const claimAuction = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { name, json } = argv;

  const client = await getDXNSClient();

  const domainKey = await client.auctionsApi.claimAuction(name);

  print({ domainKey: domainKey.toHex() }, { json });
};

export const listAuctions = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const auctions = await client.auctionsApi.listAuctions();

  print(auctions, { json });
};
