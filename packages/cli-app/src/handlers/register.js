//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';
import isEqual from 'lodash.isequal';

import { readFile, writeFile, getGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

import { APP_CONFIG_FILENAME } from '../config';

export const register = (config, { getAppRecord }) => async (argv) => {
  const { verbose, name, id, namespace, 'dry-run': noop, txKey } = argv;
  const wnsConfig = config.get('services.wns');
  const { server, userKey, bondId, chainId } = wnsConfig;

  assert(server, 'Invalid WNS endpoint.');
  assert(userKey, 'Invalid WNS userKey.');
  assert(bondId, 'Invalid WNS Bond ID.');
  assert(chainId, 'Invalid WNS Chain ID.');

  const appConfig = await readFile(APP_CONFIG_FILENAME);

  const conf = {
    ...appConfig,
    ...clean({ id, name })
  };

  log(`Registering ${conf.name}@${conf.version}...`);

  assert(conf.name, 'Invalid App Name');
  assert(conf.version, 'Invalid App Version');

  const record = getAppRecord(conf, namespace);

  const registry = new Registry(server, chainId);

  if (verbose || noop) {
    log(JSON.stringify({ registry: server, namespace, record }, undefined, 2));
  }

  if (noop) {
    return;
  }

  if (!isEqual(conf, appConfig)) {
    await writeFile(conf, APP_CONFIG_FILENAME);
  }

  const fee = getGasAndFees(argv, wnsConfig);
  const response = await registry.setRecord(userKey, record, txKey, bondId, fee);
  console.log(response.data);

  log(`Registered ${conf.name}@${conf.version}.`);
};
