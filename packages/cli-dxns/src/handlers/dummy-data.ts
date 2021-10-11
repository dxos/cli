//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { createCID, DXN } from '@dxos/registry-client';

import { Params } from './common';

const IPFS_SERVICE_DXN = 'dxos:type.service.ipfs';

export const addDummyData = (params: Params) => async () => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();

  print('Adding IPFS record...');

  const ipfsType = await client.registryClient.getResource(DXN.parse(IPFS_SERVICE_DXN));

  if (!ipfsType) {
    throw new Error('IPFS type not found');
  }

  const cid = ipfsType.record.cid;
  const serviceData = {
    type: 'ipfs',
    kube: createCID().value,
    extension: {
      '@type': cid,
      protocol: 'ipfs/0.1.0',
      addresses: [
        '/ip4/123.123.123.123/tcp/5566'
      ]
    }
  };
  await client.registryClient.insertDataRecord(serviceData, cid);

  print('IPFS record added.');
};
