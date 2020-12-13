//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';

import { getGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { Registry } from '@wirelineio/registry-client';

import { getBotConfig, updateBotConfig } from '../../config';

export const register = (config, { getBotRecord }) => async (argv) => {
  const { verbose, version, namespace, 'dry-run': noop, txKey } = argv;
  const wnsConfig = config.get('services.wns');
  const { server, userKey, bondId, chainId } = wnsConfig;

  assert(server, 'Invalid WNS endpoint.');
  assert(userKey, 'Invalid WNS userKey.');
  assert(bondId, 'Invalid WNS Bond ID.');
  assert(chainId, 'Invalid WNS Chain ID.');

  const { names = [], build, ...botConfig } = await getBotConfig();
  const { name = names } = argv;

  assert(Array.isArray(name), 'Invalid Bot Record Name.');

  const conf = {
    ...botConfig,
    ...clean({ version })
  };

  assert(conf.name, 'Invalid Bot Name.');
  assert(conf.version, 'Invalid Bot Version.');

  const record = getBotRecord(conf, namespace);

  const registry = new Registry(server, chainId);
  log(`Registering ${record.name} v${record.version}...`);

  if (verbose || noop) {
    log(JSON.stringify({ registry: server, namespace, record }, undefined, 2));
  }

  const fee = getGasAndFees(argv, wnsConfig);

  let botId;
  if (!noop) {
    await updateBotConfig(conf);
    const result = await registry.setRecord(userKey, record, txKey, bondId, fee);
    botId = result.data;
    log(`Record ID: ${botId}`);
  }
  // eslint-disable-next-line
  for await (const wrn of name) {
    log(`Assigning name ${wrn}...`);
    if (!noop) {
      await registry.setName(wrn, botId, userKey, fee);
    }
  }
};
