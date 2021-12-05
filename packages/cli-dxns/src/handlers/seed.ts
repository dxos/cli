//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import BN from 'bn.js';
import { join, dirname } from 'path';
import pb from 'protobufjs';

import { print } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { DomainKey, DXN, IRegistryClient, TypeRecordMetadata } from '@dxos/registry-client';

import { uploadToIPFS } from '../utils';
import { Params } from './common';

const DEFAULT_BALANCE = '100000000000000000000';
const DEFAULT_DOMAIN = 'dxos';
const DEFAULT_BID = 10000000;

interface TypeDescription {
  fqn: string,
  description: string
}

// TODO(marik-d): Find a better way to do this, export proto resolution logic from codec-protobuf.
const SCHEMA_PATH = join(dirname(require.resolve('@dxos/registry-client/package.json')), 'src/proto/dxns/type.proto');
const DXNS_PROTO_DIR_PATH = join(dirname(require.resolve('@dxos/registry-client/package.json')), 'src/proto/dxns');

// Mapping from resource name to protobuf name for types that will be registered on-chain.
const TYPES: Record<string, TypeDescription> = {
  'type.app': { fqn: '.dxos.type.App', description: 'Base DXOS App schema' },
  'type.bot': { fqn: '.dxos.type.Bot', description: 'Base DXOS Bot schema' },
  'type.file': { fqn: '.dxos.type.File', description: 'Base DXOS File schema' },
  'type.kube': { fqn: '.dxos.type.KUBE', description: 'Base DXOS Kube schema' },
  'type.service': { fqn: '.dxos.type.Service', description: 'Base DXOS Service schema' },
  'type.service.ipfs': { fqn: '.dxos.type.IPFS', description: 'Base DXOS IPFS Service schema' },
  'type.service.bot-factory': { fqn: '.dxos.type.BotFactory', description: 'Base DXOS Bot Factory Service schema' },
  'type.service.signal': { fqn: '.dxos.type.Signal', description: 'Base DXOS Signal Service schema' },
  'type.service.app-server': { fqn: '.dxos.type.AppServer', description: 'Base DXOS App Server Service schema' }
};

const IPFS_SERVICE_DXN = 'dxos:type.service.ipfs';
const SERVICE_DXN = 'dxos:type.service';

const bootstrapIPFS = async (registry: IRegistryClient) => {
  const ipfsType = await registry.getResourceRecord(DXN.parse(IPFS_SERVICE_DXN), 'latest');
  const serviceType = await registry.getResourceRecord(DXN.parse(SERVICE_DXN), 'latest');

  if (!serviceType) {
    throw new Error('Service type not found');
  }

  if (!ipfsType) {
    throw new Error('IPFS type not found');
  }

  const ipfsCID = ipfsType.record.cid;
  const serviceCID = serviceType.record.cid;

  const serviceData = {
    type: 'ipfs',
    extension: {
      '@type': ipfsCID,
      description: 'ipfs-enterprise.kube.dxos.network',
      protocol: 'ipfs/0.1.0',
      addresses: [
        '/ip4/165.227.111.25/tcp/4001/p2p/12D3KooWSy12JDJVZPyPmCtE8Qjfo3CLvJL6y3kpEJCCCCrTDLuv',
        '/ip4/165.227.111.25/udp/4001/quic/p2p/12D3KooWSy12JDJVZPyPmCtE8Qjfo3CLvJL6y3kpEJCCCCrTDLuv'
      ]
    }
  };
  await registry.insertDataRecord(serviceData, serviceCID);
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

  // Uploading types to IPFS
  verbose && log('Uploading types to IPFS...');
  const sourceIpfsCid = await uploadToIPFS(config, DXNS_PROTO_DIR_PATH);
  verbose && log('Uploaded types to IPFS.');

  // Register DXOS Schema.
  verbose && log('Registering DXOS schema types..');
  const root = await pb.load(SCHEMA_PATH as string);
  const meta: TypeRecordMetadata = { sourceIpfsCid };

  for (const [typeName, { fqn, description }] of Object.entries(TYPES)) {
    verbose && log(`Registering ${typeName}..`);

    const cid = await client.registryClient.insertTypeRecord(root, fqn, { ...meta, description });
    const dxn = DXN.fromDomainKey(domainKey, typeName);
    await client.registryClient.updateResource(dxn, cid);

    verbose && log(`${domain}:${typeName} registered at ${cid.toB58String()}`);
  }

  // Bootstrap IPFS
  verbose && log('Adding IPFS record...');
  await bootstrapIPFS(client.registryClient);
  verbose && log('IPFS record added.');

  print({ account, domain }, { json });
};
