//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { getGasAndFees } from '@dxos/cli-core';
import { log, logError } from '@dxos/debug';
import { Registry } from '@dxos/registry-client';

import { FILE_TYPE } from '../config';

export const register = (config) => async (argv) => {
  const { txKey, name, cid, contentType, fileName, quiet = false } = argv;
  const registryConfig = config.get('services.registry');
  const { server, userKey, bondId, chainId } = registryConfig;

  assert(server, 'Invalid Registry endpoint.');
  assert(userKey, 'Invalid Registry userKey.');
  assert(bondId, 'Invalid Registry bond ID.');
  assert(chainId, 'Invalid Registry chain ID.');

  !quiet && logError('Registering ...');

  const record = {
    type: FILE_TYPE,
    contentType,
    fileName,
    package: {
      '/': cid
    }
  };

  const registry = new Registry(server, chainId);
  const fee = getGasAndFees(argv, registryConfig);

  const result = await registry.setRecord(userKey, record, txKey, bondId, fee);
  const recordId = result.data;
  log(recordId);

  if (name && name.length) {
    // eslint-disable-next-line
    for await (const dxn of name) {
      await registry.setName(dxn, recordId, userKey, fee);
      log(dxn);
    }
  }
};
