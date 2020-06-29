//
// Copyright 2020 DxOS.
//

import assert from 'assert';
import clean from 'lodash-clean';
import isEqual from 'lodash.isequal';

import { readFile, writeFile, parseGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

import { APP_CONFIG_FILENAME } from '../config';

export const register = (config, { getAppRecord }) => async ({ verbose, name, id, namespace, 'dry-run': noop, txKey }) => {
  const { server, userKey, bondId, chainId, gas, fees } = config.get('services.wns');

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

  const fee = parseGasAndFees(gas, fees);
  await registry.setRecord(userKey, record, txKey, bondId, fee);

  log(`Registered ${conf.name}@${conf.version}.`);
};
