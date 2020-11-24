//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { getGasAndFees } from '@dxos/cli-core';
import { log, logError } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';
import { FILE_TYPE } from '../config';

export const register = (config) => async (argv) => {
  const { txKey, name, cid, contentType, fileName, quiet = false } = argv;
  const wnsConfig = config.get('services.wns');
  const { server, userKey, bondId, chainId } = wnsConfig;

  assert(server, 'Invalid WNS endpoint.');
  assert(userKey, 'Invalid WNS userKey.');
  assert(bondId, 'Invalid WNS bond ID.');
  assert(chainId, 'Invalid WNS chain ID.');

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
  const fee = getGasAndFees(argv, wnsConfig);

  const result = await registry.setRecord(userKey, record, txKey, bondId, fee);
  const recordId = result.data;
  log(recordId);

  if (name && name.length) {
    // eslint-disable-next-line
    for await (const wrn of name) {
      await registry.setName(wrn, recordId, userKey, fee);
      log(wrn);
    }
  }
};
