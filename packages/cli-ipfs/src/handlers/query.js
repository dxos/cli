//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';

import { log } from '@dxos/debug';
import { Registry } from '@dxos/registry-client';

import { FILE_TYPE } from '../config';

export const query = config => async argv => {
  const { id, name, namespace } = argv;

  const { server, chainId } = config.get('services.registry');

  assert(server, 'Invalid Registry endpoint.');
  assert(chainId, 'Invalid Registry Chain ID.');

  const registry = new Registry(server, chainId);

  let files = [];
  if (id) {
    files = await registry.getRecordsByIds([id])
      .filter(b => !name || (name && b.attributes.name === name))
      .filter(b => !namespace || (namespace && b.attributes.tag === namespace));
  } else {
    const attributes = clean({ type: FILE_TYPE, name, tag: namespace });
    files = await registry.queryRecords(attributes);
  }

  if (files && files.length) {
    log(JSON.stringify(files, null, 2));
  }
};
