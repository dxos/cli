//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';
import { CID, DXN, RegistryRecord } from '@dxos/registry-client';

import type { Params } from '../modules/app';

const APP_TYPE_DXN = 'dxos:type/app';

export const displayApps = (record: RegistryRecord) => {
  return ({
    cid: record.cid.toString(),
    created: record.created,
    description: record.description,
    displayName: record.displayName,
    bundle: CID.from(Buffer.from(record.payload.bundle, 'base64')).toString()
  });
};

interface QueryParams {
  getDXNSClient: Params['getDXNSClient'];
}

export const query = ({ getDXNSClient }: QueryParams) => async (argv: any) => {
  const { json } = argv;

  assert(getDXNSClient);
  const client = await getDXNSClient();
  const registry = client.registryClient;
  const appType = await registry.getResource(DXN.parse(APP_TYPE_DXN));
  assert(appType?.tags.latest, 'App type not found.');

  const records = await registry.getRecords({ type: appType.tags.latest });
  const apps = records.map(displayApps);

  if (apps && apps.length) {
    print(apps, { json });
  }
};
