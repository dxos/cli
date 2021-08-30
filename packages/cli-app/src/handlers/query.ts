//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';

import { print } from '@dxos/cli-core';
import { Registry } from '@wirelineio/registry-client';

import { APP_TYPE } from '../config';

export const displayApps = (record: any) => {
  return ({
    cid: record.cid.toString(),
    size: record.size,
    data: record.data
  });
};

interface QueryParams {
  getDXNSClient: Function
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
    const client = await getDXNSClient();
    const fqn = config.get('services.dxns.schema.fqn.app');

    const allRecords = await client.registryApi.getRecords();

    // TODO(egorgripasov): Don't do it on client side.
    apps = allRecords.filter(({ messageFqn }: any) => messageFqn === fqn).map(displayApps);
  }

  if (apps && apps.length) {
    print(apps, { json: true });
  }
};
