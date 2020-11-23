//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { getGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';
import { FILE_TYPE } from '../config';

export const register = (config) => async (argv) => {
  const { verbose, namespace, 'dry-run': noop, txKey, name, cid, contentType, fileName } = argv;
  const wnsConfig = config.get('services.wns');
  const { server, userKey, bondId, chainId } = wnsConfig;

  assert(server, 'Invalid WNS endpoint.');
  assert(userKey, 'Invalid WNS userKey.');
  assert(bondId, 'Invalid WNS bond ID.');
  assert(chainId, 'Invalid WNS chain ID.');

  assert(name, 'Invalid WRN.');

  log(`Registering ${name} @ ${cid}...`);

  const record = {
    type: FILE_TYPE,
    contentType,
    fileName,
    package: {
      '/': cid
    }
  };

  const registry = new Registry(server, chainId);

  if (verbose || noop) {
    log(JSON.stringify({ registry: server, namespace, record }, undefined, 2));
  }

  const fee = getGasAndFees(argv, wnsConfig);

  let recordId;
  if (!noop) {
    const result = await registry.setRecord(userKey, record, txKey, bondId, fee);
    recordId = result.data;
    log(`Record ID: ${recordId}`);
  }

  // eslint-disable-next-line
  for await (const wrn of name) {
    log(`Assigning name ${wrn}...`);
    if (!noop) {
      await registry.setName(wrn, recordId, userKey, fee);
    }
  }

  log(`Registered ${name} @ ${recordId}.`);
};
