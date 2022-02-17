//
// Copyright 2021 DXOS.org
//

import { Arguments } from 'yargs';

import { print, CoreOptions } from '@dxos/cli-core';
import { raise } from '@dxos/debug';
import { DXN, RegistryDataRecord, Resource } from '@dxos/registry-client';

import type { Params } from '../../modules/bot';

const BOT_TYPE_DXN = 'dxos:type.bot';

interface BotData {
  dxn: DXN,
  tag?: string,
  version?: string,
  description?: string,
  created?: string
}

interface QueryParams {
  getDXNSClient: Params['getDXNSClient']
}

export const mergeResourceRecords = (records: RegistryDataRecord[], resources: Resource[]) => {
  const bots: BotData[] = [];
  for (const resource of resources) {
    for (const tag of Object.keys(resource.tags)) {
      for (const record of records) {
        if (resource.tags[tag]?.equals(record.cid)) {
          bots.push({
            dxn: resource.id,
            tag,
            description: record.meta.description,
            created: record.meta.created?.toISOString()
          });
        }
      }
    }
    for (const version of Object.keys(resource.versions)) {
      for (const record of records) {
        if (resource.versions[version]?.equals(record.cid)) {
          bots.push({
            dxn: resource.id,
            version,
            description: record.meta.description,
            created: record.meta.created?.toISOString()
          });
        }
      }
    }
  }
  return bots;
};

export const query = ({ getDXNSClient }: QueryParams) => async (argv: Arguments<CoreOptions>) => {
  const { json } = argv;
  const client = await getDXNSClient();
  const registry = client.registryClient;
  const botType = await registry.getResourceRecord(DXN.parse(BOT_TYPE_DXN), 'latest') ?? raise(new Error('Bot type not found.'));
  const records = await registry.getDataRecords({ type: botType.record.cid });
  const resources = await registry.queryResources({ type: botType.record.cid });

  const bots = mergeResourceRecords(records, resources);

  if (bots.length) {
    print(bots, { json });
  }
};
