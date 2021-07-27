//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import BN from 'bn.js';
import path from 'path';
import pb from 'protobufjs';

import { print } from '@dxos/cli-core';
import { log } from '@dxos/debug';

import { Params } from './common';

const DEFAULT_BALANCE = '100000000000000000000';
const DEFAULT_DOMAIN = 'dxos';
const DEFAULT_BID = 10000000;
const DEFAULT_SCHEMA_NAME = 'schema';

const SCHEMA_PATH = path.join(__dirname, '../dxos.proto');

export const seedRegistry = (params: Params) => async (argv: any) => {
  const { getDXNSClient, config } = params;

  const { domain = DEFAULT_DOMAIN } = argv;

  const dxnsUri = config.get('services.dxns.uri');
  assert(dxnsUri, 'Admin Mnemonic should be provided via configuration profile.');

  const { mnemonic, json, verbose } = argv;

  const client = await getDXNSClient();
  const { api, keypair, keyring, registryApi, auctionsApi } = client;

  const account = keypair.address;

  const sudoer = keyring.addFromUri(mnemonic.join(' '));

  // Increase balance.
  const { free: previousFree, reserved: previousReserved } = (await api.query.system.account(account)).data;
  const requestedFree = previousFree.add(new BN(DEFAULT_BALANCE));
  const setBalanceTx = api.tx.balances.setBalance(account, requestedFree, previousReserved);

  verbose && log('Increasing Admin Balance..');
  await registryApi.sendSudoTransaction(setBalanceTx, sudoer);

  // Register Domain.
  verbose && log(`Creating auction for "${domain}" domain name..`);
  await auctionsApi.createAuction(domain, DEFAULT_BID);

  verbose && log('Force closing auction..');
  await auctionsApi.sendSudoTransaction(api.tx.registry.forceCloseAuction(domain), sudoer);

  verbose && log('Claiming Domain name..');
  const domainKey = await client.auctionsApi.claimAuction(domain);

  // Register DXOS Schema.
  verbose && log('Registering DXOS schema..');
  const root = await pb.load(SCHEMA_PATH as string);

  const hash = await registryApi.addSchema(root);
  await client.registryApi.registerResource(domainKey, DEFAULT_SCHEMA_NAME, hash);

  print({ account, domain }, { json });
};
