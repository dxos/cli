//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { DXN, IReadOnlyRegistryClient, RegistryRecord } from '@dxos/registry-client';
import { MaybePromise } from '@dxos/util';

const BOT_TYPE_DXN = 'dxos:type.bot';

export const displayBots = (record: RegistryRecord) => {
  return ({
    cid: record.cid.toString(),
    created: record.meta.created,
    description: record.meta.description
  });
};

interface QueryParams {
  getDXNSClient: () => MaybePromise<{ registryClient: IReadOnlyRegistryClient }>;
}

export const query = ({ getDXNSClient }: QueryParams) => async (argv: any) => {
  const { json } = argv;
  const client = await getDXNSClient();
  const registry = client.registryClient;
  const botType = await registry.getResourceRecord(DXN.parse(BOT_TYPE_DXN), 'latest');

  if (!botType) {
    throw new Error('Bot type not found.');
  }

  const records = await registry.getRecords({ type: botType.record.cid });

  const bots = records.map(displayBots);

  if (bots.length) {
    print(bots, { json });
  }
};
