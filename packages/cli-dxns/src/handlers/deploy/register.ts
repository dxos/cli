//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { spawnSync } from 'child_process';
import clean from 'lodash-clean';
import get from 'lodash.get';
import set from 'lodash.set';

import { log } from '@dxos/debug';
import { CID, DXN, RecordKind, UpdateResourceOptions } from '@dxos/registry-client';
import type { IRegistryClient } from '@dxos/registry-client';

import { loadConfig } from '../../utils/config';

const DEFAULT_CID_PATH = 'hash';

const TYPE_DXN_NAME_PREFIX = 'dxos:type';

export interface RegisterParams {
  cid: string
  getDXNSClient: Function
}

export const register = ({ cid, getDXNSClient }: RegisterParams) => async (argv: any) => {
  const { verbose, version, tag, 'dry-run': noop, name, domain, skipExisting, type, hashPath = DEFAULT_CID_PATH } = argv;

  assert(name, 'Invalid name.');
  assert(/^[a-zA-Z0-9][a-zA-Z0-9-.]{1,61}[a-zA-Z0-9-]{2,}$/.test(name), 'Name could contain only letters, numbers, dashes or dots.');

  assert(domain, 'Invalid domain.');
  assert(type, 'Invalid type.');

  const conf = await loadConfig();

  const { record: recordData, ...rest } = conf.values.module!;

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

  assert(record.name, 'Invalid record name.');

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

  const recordType = await client.registryClient.getResourceRecord(DXN.parse(`${TYPE_DXN_NAME_PREFIX}.${type}`), 'latest');
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
        await client.registryClient.updateResource(DXN.fromDomainKey(domainKey, dxn), recordCID, opts);
      } catch (err) {
        if (skipExisting && String(err).includes('VersionAlreadyExists')) {
          verbose && log('Skipping existing version.');
        } else {
          throw err;
        }
      }
    }
  }

  verbose && log(`Registered ${record.name}.` + (record.tag ? ` Tagged ${record.tag.join(', ')}.` : '') + (record.version ? ` Version ${record.version}.` : ''));
};
