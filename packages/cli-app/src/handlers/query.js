//
// Copyright 2020 DxOS.
//

import assert from 'assert';
import clean from 'lodash-clean';

import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

import { APP_TYPE } from '../config';

export const query = config => async argv => {
  const { id, name, namespace } = argv;

  const { server, chainId } = config.get('services.wns');

  assert(server, 'Invalid WNS endpoint.');
  assert(chainId, 'Invalid WNS Chain ID.');

  const registry = new Registry(server, chainId);

  let apps = [];
  if (id) {
    apps = await registry.getRecordsByIds([id]);
    apps = apps
      .filter(b => !name || (name && b.attributes.name === name))
      .filter(b => !namespace || (namespace && b.attributes.tag === namespace));
  } else {
    const attributes = clean({ type: APP_TYPE, name, tag: namespace });
    apps = await registry.queryRecords(attributes);
  }

  if (apps && apps.length) {
    log(JSON.stringify(apps, null, 2));
  }
};
