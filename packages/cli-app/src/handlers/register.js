//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import clean from 'lodash-clean';

import { getGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

import { loadAppConfig, updateAppConfig } from './config';

export const register = (config, { getAppRecord }) => async (argv) => {
  const { verbose, version, namespace, 'dry-run': noop, txKey, name } = argv;
  const wnsConfig = config.get('services.wns');
  const { server, userKey, bondId, chainId } = wnsConfig;

  assert(server, 'Invalid WNS endpoint.');
  assert(userKey, 'Invalid WNS userKey.');
  assert(bondId, 'Invalid WNS bond ID.');
  assert(chainId, 'Invalid WNS chain ID.');

  const conf = {
    ...await loadAppConfig(),
    ...clean({ version })
  };

  assert(name, 'Invalid WRN.');
  assert(conf.name, 'Invalid app name.');
  assert(conf.version, 'Invalid app version.');

  const { status, stdout } = spawnSync('git', [
    'describe',
    '--tags',
    '--first-parent',
    '--abbrev=99',
    '--long',
    '--dirty',
    '--always'
  ], { shell: true });
  conf.repositoryVersion = status === 0 ? stdout.toString().trim() : undefined;

  log(`Registering ${conf.name}@${conf.version}...`);

  const record = getAppRecord(conf, namespace);
  const registry = new Registry(server, chainId);

  if (verbose || noop) {
    log(JSON.stringify({ registry: server, namespace, record }, undefined, 2));
  }

  const fee = getGasAndFees(argv, wnsConfig);

  let appId;
  if (!noop) {
    await updateAppConfig(conf);
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
