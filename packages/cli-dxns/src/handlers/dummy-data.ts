//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';
import { createCID, DXN } from '@dxos/registry-client';

import { Params } from '../interfaces';

const BOT_TYPE_DXN = 'dxos:type/bot';

export const addDummyData = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const client = await getDXNSClient();
  const registry = client.registryClient;
  const account = await client.getDXNSAccount(argv);

  print('Adding bot record');

  const botType = await registry.getResource(DXN.parse(BOT_TYPE_DXN));
  assert(botType, 'Bot type not found.');

  const cid = await registry.registerRecord({
    hash: createCID().value
  }, botType, {
    description: 'Test bot'
  });

  const domainKey = await registry.getDomainKey('dxos');
  const name = DXN.fromDomainKey(domainKey, 'testBot', 'latest');
  await registry.registerResource(name, cid, account);

  print('Bot record added');
};
