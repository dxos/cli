//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import BN from 'bn.js';
import { join, dirname } from 'path';
import pb from 'protobufjs';

import { print } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { DomainKey, RecordMetadata } from '@dxos/registry-client';

import { Params } from './common';

const DEFAULT_BALANCE = '100000000000000000000';
const DEFAULT_DOMAIN = 'dxos';
const DEFAULT_BID = 10000000;

// TODO(marik-d): Find a better way to do this, export proto resolution logic from codec-protobuf.
const SCHEMA_PATH = join(dirname(require.resolve('@dxos/registry-client/package.json')), 'src/proto/dxns/type.proto');

// Mapping from resource name to protobuf name for types that will be registered on-chain.
const TYPES = {
  'type.app': '.dxos.type.App',
  'type.bot': '.dxos.type.Bot',
  'type.file': '.dxos.type.File',
  'type.kube': '.dxos.type.KUBE',
  'type.service': '.dxos.type.Service',
  'type.botFactory': '.dxos.type.BotFactory',
  'type.service.ipfs': '.dxos.type.IPFS',
  'type.service.bot-factory': '.dxos.type.BotFactory',
  'type.service.signal': '.dxos.type.Signal',
  'type.service.app-server': '.dxos.type.AppServer'
};

export const seedRegistry = (params: Params) => async (argv: any) => {
  const { getDXNSClient, config } = params;

  const { domain = DEFAULT_DOMAIN, dataOnly = false, json, verbose } = argv;

  const dxnsUri = config.get('services.dxns.accountUri');
  assert(dxnsUri, 'Admin Mnemonic should be provided via configuration profile.');

  const client = await getDXNSClient();
  const { apiRaw, keypair, keyring, auctionsClient, transactionHandler } = client;

  const account = keypair?.address;

  let domainKey: DomainKey;
  if (!dataOnly) {
    const { mnemonic } = argv;
    assert(mnemonic, 'Sudo user mnemonic required');
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
    await auctionsClient.createAuction(domain, DEFAULT_BID);

    verbose && log('Force closing auction..');
    await transactionHandler.sendSudoTransaction(apiRaw.tx.registry.forceCloseAuction(domain), sudoer);

    verbose && log('Claiming Domain name..');
    domainKey = await client.auctionsClient.claimAuction(domain);
  } else {
    domainKey = await client.registryClient.resolveDomainName(domain);
  }

  // Register DXOS Schema.
  verbose && log('Registering DXOS schema types..');
  const root = await pb.load(SCHEMA_PATH as string);
  const meta: RecordMetadata = {
    created: new Date(),
    version: '0.1.0',
    description: 'Base DXOS schema'
  };

  for (const [typeName, fqn] of Object.entries(TYPES)) {
    verbose && log(`Registering ${typeName}..`);

    const cid = await client.registryClient.insertTypeRecord(root, fqn, meta);
    await client.registryClient.registerResource(domainKey, typeName, cid);

    verbose && log(`${domain}:${typeName} registered at ${cid.toB58String()}`);
  }

  print({ account, domain }, { json });
};
