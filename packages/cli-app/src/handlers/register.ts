//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import clean from 'lodash-clean';

import { getGasAndFees } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { CID, DXN, RecordKind, RegistryTypeRecord } from '@dxos/registry-client';
import type { IRegistryClient } from '@dxos/registry-client';
import { Registry } from '@wirelineio/registry-client';

import { loadAppConfig, updateAppConfig } from './config';

export interface RegisterParams {
  getAppRecord: Function,
  getDXNSClient: Function
}

export const APP_DXN_NAME = 'dxos:type.app';

export const register = (config: any, { getAppRecord, getDXNSClient }: RegisterParams) => async (argv: any) => {
  const { verbose, version, namespace, 'dry-run': noop, txKey, name, domain, dxns } = argv;
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

  if (!noop) {
    await updateAppConfig(conf);
  }

  // TODO(egorgripasov): Deprecate.
  if (!dxns) {
    const fee = getGasAndFees(argv, wnsConfig);

    let appId;
    if (!noop) {
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

    const client: { registryClient: IRegistryClient } = await getDXNSClient();

    const appType = await client.registryClient.getResource<RegistryTypeRecord>(DXN.parse(APP_DXN_NAME));
    assert(appType);
    assert(appType.record.kind === RecordKind.Type);

    const cid = await client.registryClient.insertDataRecord({
      hash: CID.from(pkg['/']).value,
      ...rest
    }, appType?.record.cid, {
      created: new Date(),
      version,
      author,
      description,
      name: appName
    });

    const domainKey = await client.registryClient.resolveDomainName(domain);
    await client.registryClient.registerResource(domainKey, name, cid);
  }

  log(`Registered ${conf.name}@${conf.version}.`);
};
