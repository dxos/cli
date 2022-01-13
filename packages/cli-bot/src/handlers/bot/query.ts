//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { raise } from '@dxos/debug';
import { CID, DXN, RegistryDataRecord } from '@dxos/registry-client';

import type { Params } from '../../modules/bot';

const BOT_TYPE_DXN = 'dxos:type.bot';

export const displayBots = (record: RegistryDataRecord) => {
  return ({
    cid: record.cid.toString(),
    created: record.meta.created,
    description: record.meta.description,
    hash: CID.from(Buffer.from(record.data.hash, 'base64')).toString()
  });
};

interface QueryParams {
  getDXNSClient: Params['getDXNSClient']
}

export const query = ({ getDXNSClient }: QueryParams) => async (argv: any) => {
  const { json } = argv;
  const client = await getDXNSClient();
  const registry = client.registryClient;
  const botType = await registry.getResourceRecord(DXN.parse(BOT_TYPE_DXN), 'latest') ?? raise(new Error('Bot type not found.'));
  const records = await registry.getDataRecords({ type: botType.record.cid });

  const bots = records.map(displayBots);

  if (bots.length) {
    print(bots, { json });
  }
};
