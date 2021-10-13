//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { createCID, DXN, IRegistryClient } from '@dxos/registry-client';

import { Params } from './common';

const IPFS_SERVICE_DXN = 'dxos:type.service.ipfs';
const BOT_TYPE_DXN = 'dxos:type.bot';
const SERVICE_DXN = 'dxos:type.service';

const addIPFSRecord = async (registry: IRegistryClient) => {
  print('Adding IPFS record...');

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
    kube: createCID().value,
    extension: {
      '@type': ipfsCID,
      protocol: 'ipfs/0.1.0',
      addresses: [
        '/ip4/123.123.123.123/tcp/5566'
      ]
    }
  };
  await registry.insertDataRecord(serviceData, serviceCID);

  print('IPFS record added.');
};

export const addBotRecord = async (registry: IRegistryClient) => {
  print('Adding bot record');

  const botType = await registry.getResourceRecord(DXN.parse(BOT_TYPE_DXN), 'latest');

  if (!botType) {
    throw new Error('Bot type not found.');
  }

  const cid = await registry.insertDataRecord({
    hash: createCID().value
  }, botType.record.cid, {
    description: 'Test bot'
  });

  const domainKey = await registry.resolveDomainName('dxos');
  const dxn = DXN.fromDomainKey(domainKey, 'testBot');
  await registry.updateResource(dxn, cid);

  print('Bot record added');
};

export const addDummyData = (params: Params) => async () => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();

  await addIPFSRecord(client.registryClient);

  await addBotRecord(client.registryClient);
};
