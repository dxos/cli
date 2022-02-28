//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import clean from 'lodash-clean';
import get from 'lodash.get';
import set from 'lodash.set';

import { log } from '@dxos/debug';
import { AccountKey, CID, DXN, RecordKind, UpdateResourceOptions } from '@dxos/registry-client';
import type { IRegistryClient } from '@dxos/registry-client';

import { Params } from '../../interfaces';
import { loadConfig } from '../../utils/config';

const DEFAULT_CID_PATH = 'hash';

const TYPE_DXN_NAME_PREFIX = 'dxos:type.';

export interface RegisterParams {
  cid: string
  getDXNSClient: Params['getDXNSClient']
  account: AccountKey
}

export const register = ({ cid, getDXNSClient, account }: RegisterParams) => async (argv: any) => {
  const { verbose, version, tag, 'dry-run': noop, skipExisting, hashPath = DEFAULT_CID_PATH, config: configPath } = argv;

  const conf = await loadConfig(configPath);
  const { record: recordData, ...rest } = conf.values.module!;

  let { name, domain, type } = argv;

  if ((!name || !domain) && rest.name) {
    const recordDXN = DXN.parse(rest.name);
    name = [recordDXN.resource];
    domain = recordDXN.domain;
  }

  assert(name && name.length, 'Invalid name.');
  assert(domain, 'Invalid domain.');

  name.map((singleName: string) => assert(/^[a-zA-Z0-9][a-zA-Z0-9-.]{1,61}[a-zA-Z0-9-]{2,}$/.test(singleName), 'Name could contain only letters, numbers, dashes or dots.'));

  if (!type && rest.type) {
    type = rest.type.replace(TYPE_DXN_NAME_PREFIX, '');
  }

  assert(type, 'Invalid type.');

  // Type specific fields, e.g. for app, bot, etc records.
  const recordDataFromType = get(recordData, type, {});

  // Compose record.
  const record = {
    ...rest,
    ...recordDataFromType,
    ...clean({ version }),
    ...clean({ tag })
  };

  if (record.version === 'false') {
    record.version = null;
  }

  // Repo version.
  const { status, stdout } = spawnSync('git', [
    'describe',
    '--tags',
    '--first-parent',
    '--abbrev=99',
    '--long',
    '--dirty',
    '--always'
  ], { shell: true });
  record.repositoryVersion = status === 0 ? stdout.toString().trim() : undefined;

  // Inject IPFS CID.
  set(record, hashPath, CID.from(cid).value);

  verbose && log(`Registering ${record.name}.` + (record.tag ? ` Tagged ${record.tag.join(', ')}.` : '') + (record.version ? ` Version ${record.version}.` : ''));

  if (verbose || noop) {
    log(JSON.stringify({ record }, undefined, 2));
  }

  const { description, ...data } = record;

  const client: { registryClient: IRegistryClient } = await getDXNSClient();

  const recordType = await client.registryClient.getResourceRecord(DXN.parse(`${TYPE_DXN_NAME_PREFIX}${type}`), 'latest');
  assert(recordType);
  assert(recordType.record.kind === RecordKind.Type, `Can not find type "${type}" in DXNS.`);

  let recordCID;
  if (!noop) {
    recordCID = await client.registryClient.insertDataRecord(data, recordType?.record.cid, {
      // TODO(egorgripasov): Other meta?
      description
    });
  }

  const domainKey = await client.registryClient.resolveDomainName(domain);
  const opts: UpdateResourceOptions = { version: record.version, tags: record.tag ?? ['latest'] };
  for (const dxn of name) {
    verbose && log(`Assigning name ${dxn}...`);
    if (!noop && recordCID) {
      try {
        await client.registryClient.updateResource(DXN.fromDomainKey(domainKey, dxn), account, recordCID, opts);
      } catch (err) {
        if (skipExisting && String(err).includes('VersionAlreadyExists')) {
          verbose && log('Skipping existing version.');
        } else {
          throw err;
        }
      }
    }
  }

  verbose && log(`Registered ${name.join(', ')}.` + (record.tag ? ` Tagged ${record.tag.join(', ')}.` : '') + (record.version ? ` Version ${record.version}.` : ''));
};
