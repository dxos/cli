//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import clean from 'lodash-clean';

import { getGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { CID } from '@dxos/registry-api';
import { Registry } from '@wirelineio/registry-client';

import { loadAppConfig, updateAppConfig } from './config';

export const register = (config, { getAppRecord, getDXNSClient }) => async (argv) => {
  const { verbose, version, namespace, 'dry-run': noop, txKey, name, domain, dxns, schema = config.get('services.dxns.schema.cid') } = argv;
  const wnsConfig = config.get('services.wns');
  const { server, userKey, bondId, chainId } = wnsConfig;

  // TODO(egorgripasov): Deprecate.
  if (!dxns) {
    assert(server, 'Invalid WNS endpoint.');
    assert(userKey, 'Invalid WNS userKey.');
    assert(bondId, 'Invalid WNS bond ID.');
    assert(chainId, 'Invalid WNS chain ID.');
  }

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

  // TODO(egorgripasov): Deprecate.
  if (!dxns) {
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
  } else {
    assert(/^[a-zA-Z0-9][a-zA-Z0-9-.]{1,61}[a-zA-Z0-9-]{2,}$/.test(name), 'Name could contain only letters, numbers, dashes or dots.');

    // TODO(egorgripasov): Adapter for the new record format. Cleanup.
    const { name: appName, version, author, description, package: pkg, ...rest } = conf;

    const client = await getDXNSClient();
    const fqn = config.get('services.dxns.schema.fqn.app');
    const schemaCid = CID.from(schema);

    const data = {
      attributes: { name: appName, version, author, description },
      hash: CID.from(pkg['/']).value,
      ...rest
    };

    const cid = await client.registryApi.addRecord(data, schemaCid, fqn);

    const domainKey = await client.registryApi.resolveDomainName(domain);
    await client.registryApi.registerResource(domainKey, name, cid);
  }

  log(`Registered ${conf.name}@${conf.version}.`);
};
