//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { createCID, DXN } from '@dxos/registry-client';

import { Params } from './common';

const IPFS_SERVICE_DXN = 'dxos:type.service.ipfs';
const SERVICE_DXN = 'dxos:type.service';

export const addDummyData = (params: Params) => async () => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();

  print('Adding IPFS record...');

  const ipfsType = await client.registryClient.getResourceRecord(DXN.parse(IPFS_SERVICE_DXN), 'latest');
  const serviceType = await client.registryClient.getResourceRecord(DXN.parse(SERVICE_DXN), 'latest');

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
  await client.registryClient.insertDataRecord(serviceData, serviceCID);

  print('IPFS record added.');
};
