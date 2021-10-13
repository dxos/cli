//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';

import { print } from '@dxos/cli-core';
import { DXN, RegistryRecord } from '@dxos/registry-client';
import { Registry } from '@wirelineio/registry-client';

import { APP_TYPE } from '../config';
import { GetDXNSClient } from '../types';

const APP_TYPE_DXN = 'dxos:type.app';

export const displayApps = (record: RegistryRecord) => {
  return ({
    cid: record.cid.toString(),
    created: record.meta.created,
    description: record.meta.description
  });
};

interface QueryParams {
  getDXNSClient: GetDXNSClient;
}

export const query = (config: any, { getDXNSClient }: QueryParams) => async (argv: any) => {
  const { id, name, namespace, dxns } = argv;

  let apps = [];
  // TODO(egorgripasov): Deprecate.
  if (!dxns) {
    const { server, chainId } = config.get('services.wns');
    assert(server, 'Invalid WNS endpoint.');
    assert(chainId, 'Invalid WNS Chain ID.');

    const registry = new Registry(server, chainId);

    if (id) {
      apps = await registry.getRecordsByIds([id]);
      apps = apps
        .filter((b: any) => !name || (name && b.attributes.name === name))
        .filter((b: any) => !namespace || (namespace && b.attributes.tag === namespace));
    } else {
      const attributes = clean({ type: APP_TYPE, name, tag: namespace });
      apps = await registry.queryRecords(attributes);
    }
  } else {
    assert(getDXNSClient);
    const client = await getDXNSClient();
    const registry = client.registryClient;
    const appType = await registry.getResourceRecord(DXN.parse(APP_TYPE_DXN), 'latest');

    if (!appType) {
      throw new Error('App type not found');
    }

    const records = await registry.getRecords({ type: appType.record.cid });

    apps = records.map(displayApps);
  }

  if (apps && apps.length) {
    print(apps, { json: true });
  }
};
