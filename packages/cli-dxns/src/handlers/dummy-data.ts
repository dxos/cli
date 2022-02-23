//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { raise } from '@dxos/debug';
import { createCID, DXN } from '@dxos/registry-client';

import { Params } from '../interfaces';

const BOT_TYPE_DXN = 'dxos:type.bot';

export const addDummyData = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();
  const registry = client.registryClient;
  const account = await client.getDXNSAccount(argv);

  print('Adding bot record');

  const botType = await registry.getResourceRecord(DXN.parse(BOT_TYPE_DXN), 'latest') ?? raise(new Error('Bot type not found.'));

  const cid = await registry.insertDataRecord({
    hash: createCID().value
  }, botType.record.cid, {
    description: 'Test bot'
  });

  const domainKey = await registry.resolveDomainName('dxos');
  const dxn = DXN.fromDomainKey(domainKey, 'testBot');
  await registry.updateResource(dxn, account, cid);

  print('Bot record added');
};
