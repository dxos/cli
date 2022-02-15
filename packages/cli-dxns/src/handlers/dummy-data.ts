//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';
import { raise } from '@dxos/debug';
import { AccountKey, createCID, DXN } from '@dxos/registry-client';

import { Params } from '../interfaces';

const BOT_TYPE_DXN = 'dxos:type.bot';

export const addDummyData = (params: Params) => async () => {
  const { getDXNSClient, config } = params;

  const account = config.get('runtime.services.dxns.dxnsAccount');
  assert(account, 'Create a DXNS account using `dx dxns account create`');

  const client = await getDXNSClient();
  const registry = client.registryClient;

  print('Adding bot record');

  const botType = await registry.getResourceRecord(DXN.parse(BOT_TYPE_DXN), 'latest') ?? raise(new Error('Bot type not found.'));

  const cid = await registry.insertDataRecord({
    hash: createCID().value
  }, botType.record.cid, {
    description: 'Test bot'
  });

  const domainKey = await registry.resolveDomainName('dxos');
  const dxn = DXN.fromDomainKey(domainKey, 'testBot');
  await registry.updateResource(dxn, AccountKey.fromHex(account), cid);

  print('Bot record added');
};
