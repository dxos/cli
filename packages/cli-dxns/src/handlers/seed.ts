//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import BN from 'bn.js';
import path from 'path';
import pb from 'protobufjs';

import { print } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { RecordMetadata } from '@dxos/registry-api';

import { Params } from './common';

const DEFAULT_BALANCE = '100000000000000000000';
const DEFAULT_DOMAIN = 'dxos';
const DEFAULT_BID = 10000000;
const DEFAULT_SCHEMA_NAME = 'schema';

const SCHEMA_PATH = path.join(__dirname, '../dxos.proto');

// TODO(dmaretskyi): Define types as protobuf metadata instead of hardcoding them
const TYPES = {
  kube: '.dxos.KUBE',
  service: '.dxos.Service',
  app: '.dxos.App',
  bot: '.dxos.Bot',
  botFactory: '.dxos.BotFactory',
  file: '.dxos.File'
};

export const seedRegistry = (params: Params) => async (argv: any) => {
  const { getDXNSClient, config } = params;

  const { domain = DEFAULT_DOMAIN } = argv;

  const dxnsUri = config.get('services.dxns.uri');
  assert(dxnsUri, 'Admin Mnemonic should be provided via configuration profile.');

  const { mnemonic, json, verbose } = argv;
  assert(mnemonic, 'Sudo user mnemonic required');

  const client = await getDXNSClient();
  const { apiRaw, keypair, keyring, registryApi, auctionsApi, transactionHandler } = client;

  const account = keypair?.address;

  const sudoer = keyring.addFromUri(mnemonic.join(' '));

  // Increase balance.
  if (account) {
    const { free: previousFree, reserved: previousReserved } = (await apiRaw.query.system.account(account)).data;
    const requestedFree = previousFree.add(new BN(DEFAULT_BALANCE));
    const setBalanceTx = apiRaw.tx.balances.setBalance(account, requestedFree, previousReserved);

    verbose && log('Increasing Admin Balance..');
    await transactionHandler.sendSudoTransaction(setBalanceTx, sudoer);
  }

  // Register Domain.
  verbose && log(`Creating auction for "${domain}" domain name..`);
  await auctionsApi.createAuction(domain, DEFAULT_BID);

  verbose && log('Force closing auction..');
  await transactionHandler.sendSudoTransaction(apiRaw.tx.registry.forceCloseAuction(domain), sudoer);

  verbose && log('Claiming Domain name..');
  const domainKey = await client.auctionsApi.claimAuction(domain);

  // Register DXOS Schema.
  verbose && log('Registering DXOS schema..');
  const root = await pb.load(SCHEMA_PATH as string);
  const meta: RecordMetadata = {
    created: new Date().getTime().toString(),
    version: '1.0.0',
    name: DEFAULT_SCHEMA_NAME,
    description: 'Base DXOS schema',
    author: 'DXOS'
  };

  for (const [type, fqn] of Object.entries(TYPES)) {
    verbose && log(`Registering type.${type}..`);

    const cid = await client.registryApi.insertTypeRecord(root, fqn, meta);
    await client.registryApi.registerResource(domainKey, `type.${type}`, cid);

    verbose && log(`${domain}:type.${type} registered at ${cid.toB58String()}`);
  }

  print({ account, domain }, { json });
};
