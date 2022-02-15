//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import clean from 'lodash-clean';

import { log } from '@dxos/debug';
import { AccountKey, CID, DXN, RecordKind, UpdateResourceOptions } from '@dxos/registry-client';
import type { IRegistryClient } from '@dxos/registry-client';

import type { Params } from '../modules/app';
import { loadAppConfig, updateAppConfig } from './config';

export interface RegisterParams {
  getAppRecord: Function,
  getDXNSClient: Params['getDXNSClient']
  account: AccountKey
}

export const APP_DXN_NAME = 'dxos:type.app';

export const register = ({ getAppRecord, getDXNSClient, account }: RegisterParams) => async (argv: any) => {
  const { verbose, version, tag, namespace, 'dry-run': noop, name, domain, skipExisting } = argv;

  const conf = {
    ...await loadAppConfig(),
    ...clean({ version }),
    ...clean({ tag })
  };
  if (conf.version === 'false') {
    conf.version = null;
  }

  assert(name, 'Invalid name.');
  assert(domain, 'Invalid domain');

  assert(conf.name, 'Invalid app name.');

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

  log(`Registering ${conf.name}.` + (conf.tag ? ` Tagged ${conf.tag.join(', ')}.` : '') + (conf.version ? ` Version ${conf.version}.` : ''));

  const record = getAppRecord(conf, namespace);

  if (verbose || noop) {
    log(JSON.stringify({ record }, undefined, 2));
  }

  if (!noop) {
    await updateAppConfig(conf);
  }

  assert(/^[a-zA-Z0-9][a-zA-Z0-9-.]{1,61}[a-zA-Z0-9-]{2,}$/.test(name), 'Name could contain only letters, numbers, dashes or dots.');

  const { description, package: pkg, ...rest } = conf;

  const client: { registryClient: IRegistryClient } = await getDXNSClient();

  const appType = await client.registryClient.getResourceRecord(DXN.parse(APP_DXN_NAME), 'latest');
  assert(appType);
  assert(appType.record.kind === RecordKind.Type);

  let cid;
  if (!noop) {
    cid = await client.registryClient.insertDataRecord({
      hash: CID.from(pkg['/']).value,
      ...rest
    }, appType?.record.cid, {
      description
    });
  }

  const domainKey = await client.registryClient.resolveDomainName(domain);
  const opts: UpdateResourceOptions = { version: conf.version, tags: conf.tag ?? ['latest'] };
  for (const dxn of name) {
    log(`Assigning name ${dxn}...`);
    if (!noop && cid) {
      try {
        await client.registryClient.updateResource(DXN.fromDomainKey(domainKey, dxn), account, cid, opts);
      } catch (err) {
        if (skipExisting && String(err).includes('VersionAlreadyExists')) {
          log('Skipping existing version.');
        } else {
          throw err;
        }
      }
    }
  }

  log(`Registered ${conf.name}.` + (conf.tag ? ` Tagged ${conf.tag.join(', ')}.` : '') + (conf.version ? ` Version ${conf.version}.` : ''));
};
