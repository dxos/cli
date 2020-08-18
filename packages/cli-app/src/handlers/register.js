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
  const { verbose, version, namespace, 'dry-run': noop, txKey } = argv;
  const wnsConfig = config.get('services.wns');
  const { server, userKey, bondId, chainId } = wnsConfig;

  assert(server, 'Invalid WNS endpoint.');
  assert(userKey, 'Invalid WNS userKey.');
  assert(bondId, 'Invalid WNS Bond ID.');
  assert(chainId, 'Invalid WNS Chain ID.');

  const { names = [], ...appConfig } = await readFile(APP_CONFIG_FILENAME);
  const { name = names } = argv;

  assert(Array.isArray(name), 'Invalid App Record Name.');

  const conf = {
    ...appConfig,
    ...clean({ version })
  };

  log(`Registering ${conf.name}@${conf.version}...`);

  assert(conf.name, 'Invalid App Name');
  assert(conf.version, 'Invalid App Version');

  const record = getAppRecord(conf, namespace);

  const registry = new Registry(server, chainId);

  if (verbose || noop) {
    log(JSON.stringify({ registry: server, namespace, record }, undefined, 2));
  }

  const fee = getGasAndFees(argv, wnsConfig);

  let appId;
  if (!noop) {
    if (!isEqual(conf, appConfig)) {
      await writeFile(conf, APP_CONFIG_FILENAME);
    }
    const result = await registry.setRecord(userKey, record, txKey, bondId, fee);
    appId = result.data;
    log(`Record ID: ${appId}`);
  }

  // eslint-disable-next-line
  for await (const wrn of name) {
    log(`Assigning name ${wrn}...`);
    if (!noop) {
      await registry.setName(wrn, appId, userKey, fee);
    }
  }

  log(`Registered ${conf.name}@${conf.version}.`);
};
