//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import BN from 'bn.js';
import { join, dirname } from 'path';
import pb from 'protobufjs';

import { print } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { DomainKey, DXN, RegistryClient, TypeRecordMetadata } from '@dxos/registry-client';

import { Params } from '../interfaces';
import { uploadToIPFS } from '../utils';

const DEFAULT_BALANCE = '100000000000000000000';
const DEFAULT_DOMAINS = ['dxos', 'example'];
const DEFAULT_BID = 10000000;

interface TypeDescription {
  fqn: string,
  description: string
}

// TODO(marik-d): Find a better way to do this, export proto resolution logic from codec-protobuf.
const SCHEMA_PATH = join(dirname(require.resolve('@dxos/registry-client/package.json')), 'src/proto/dxns/types.proto');
const DXNS_PROTO_DIR_PATH = join(dirname(require.resolve('@dxos/registry-client/package.json')), 'src/proto/dxns');

// Mapping from resource name to protobuf name for types that will be registered on-chain.
const TYPES: Record<string, TypeDescription> = {
  'type/app': { fqn: '.dxos.type.App', description: 'Base DXOS App schema' },
  'type/bot': { fqn: '.dxos.type.Bot', description: 'Base DXOS Bot schema' },
  'type/file': { fqn: '.dxos.type.File', description: 'Base DXOS File schema' },
  'type/kube': { fqn: '.dxos.type.KUBE', description: 'Base DXOS Kube schema' },
  'type/service': { fqn: '.dxos.type.Service', description: 'Base DXOS Service schema' },
  'type/service/ipfs': { fqn: '.dxos.type.IPFS', description: 'Base DXOS IPFS Service schema' },
  'type/service/bot-factory': { fqn: '.dxos.type.BotFactory', description: 'Base DXOS Bot Factory Service schema' },
  'type/service/signal': { fqn: '.dxos.type.Signal', description: 'Base DXOS Signal Service schema' },
  'type/service/app-server': { fqn: '.dxos.type.AppServer', description: 'Base DXOS App Server Service schema' }
};

const IPFS_SERVICE_DXN = 'dxos:type/service/ipfs';
const SERVICE_DXN = 'dxos:type/service';

const bootstrapIPFS = async (registry: RegistryClient) => {
  const ipfsType = await registry.getResource(DXN.parse(IPFS_SERVICE_DXN));
  const serviceType = await registry.getResource(DXN.parse(SERVICE_DXN));

  if (!serviceType) {
    throw new Error('Service type not found');
  }

  if (!ipfsType) {
    throw new Error('IPFS type not found');
  }

  const serviceData = {
    type: 'ipfs',
    extension: {
      '@type': ipfsType,
      description: 'ipfs1.kube.dxos.network',
      protocol: 'ipfs/0.1.0',
      addresses: [
        '/ip4/167.99.123.6/tcp/4001/p2p/12D3KooWKsBxZVe4ycB1hkxsFuLkHvkZPtwpi3VMQmNrHhApUTTL',
        '/ip4/167.99.123.6/udp/4001/quic/p2p/12D3KooWKsBxZVe4ycB1hkxsFuLkHvkZPtwpi3VMQmNrHhApUTTL'
      ]
    }
  };
  await registry.registerRecord(serviceData, serviceType);
};

export const seedRegistry = (params: Params) => async (argv: any) => {
  const { getDXNSClient, config } = params;

  const { domain: domains = DEFAULT_DOMAINS, dataOnly = false, json, verbose } = argv;

  const client = await getDXNSClient();
  const account = await client.getDXNSAccount(argv);
  const { apiRaw, keyring, auctionsClient, registryClient, transactionHandler, dxnsAddress } = client;

  assert(dxnsAddress, 'Create a Polkadot address using `dx dxns address`');

  let domainKey: DomainKey | undefined;
  if (!dataOnly) {
    const { mnemonic } = argv;
    assert(mnemonic, 'Sudo user mnemonic required');
    assert(domains.length, 'At least one domain is required');

    const sudoer = keyring.addFromUri(mnemonic.join(' '));

    // Increase balance.
    const { free: previousFree, reserved: previousReserved } = (await apiRaw.query.system.account(dxnsAddress)).data;
    const requestedFree = previousFree.add(new BN(DEFAULT_BALANCE));
    const setBalanceTx = apiRaw.tx.balances.setBalance(dxnsAddress, requestedFree, previousReserved);

    verbose && log('Increasing Admin Balance..');
    await transactionHandler.sendSudoTransaction(setBalanceTx, sudoer);

    for (const domain of domains) {
      // Register Domain.
      verbose && log(`Creating auction for "${domain}" domain name..`);
      await auctionsClient.createAuction(domain, DEFAULT_BID);

      verbose && log('Force closing auction..');
      await transactionHandler.sendSudoTransaction(apiRaw.tx.registry.forceCloseAuction(domain), sudoer);

      verbose && log('Claiming Domain name..');
      const newDomainKey = await auctionsClient.claimAuction(domain, account);
      domainKey = domainKey ?? newDomainKey;
    }
  } else {
    domainKey = await registryClient.getDomainKey(domains[0]);
  }

  // Uploading types to IPFS
  verbose && log('Uploading types to IPFS...');
  const protobufIpfsCid = await uploadToIPFS(config, DXNS_PROTO_DIR_PATH);
  verbose && log('Uploaded types to IPFS.');

  // Register DXOS Schema.
  verbose && log('Registering DXOS schema types..');
  const root = await pb.load(SCHEMA_PATH as string);
  const meta: TypeRecordMetadata = { protobufIpfsCid };

  for (const [typeName, { fqn, description }] of Object.entries(TYPES)) {
    verbose && log(`Registering ${typeName}..`);

    const cid = await registryClient.registerTypeRecord(fqn, root, { ...meta, description });
    const name = DXN.fromDomainKey(domainKey!, typeName, 'latest');
    await registryClient.registerResource(name, cid, account);

    verbose && log(`${domains[0]}:${typeName} registered at ${cid.toB58String()}`);
  }

  // Bootstrap IPFS
  verbose && log('Adding IPFS record...');
  await bootstrapIPFS(registryClient);
  verbose && log('IPFS record added.');

  print({ account, domains }, { json });
};
