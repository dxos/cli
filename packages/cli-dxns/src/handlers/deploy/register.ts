//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';
import set from 'lodash.set';

import { log } from '@dxos/debug';
import { AccountKey, CID, DXN, RecordKind, UpdateResourceOptions } from '@dxos/registry-client';
import type { IRegistryClient } from '@dxos/registry-client';

import { Params } from '../../interfaces';
import { PackageModule } from '../../utils/config';

const DEFAULT_CID_PATH = 'bundle';

export interface RegisterParams {
  cid: string
  license?: string
  getDXNSClient: Params['getDXNSClient']
  account: AccountKey
  module: PackageModule
}

export const register = ({ getDXNSClient, module, cid, license, account }: RegisterParams) => async (argv: any) => {
  const { verbose, version, tag, 'dry-run': noop, skipExisting, hashPath = DEFAULT_CID_PATH } = argv;

  const { name, type, displayName, description, tags, record: dataRecord } = module;

  assert(name, 'Invalid name.');
  assert(type, 'Invalid type.');

  const { resource, domain } = DXN.parse(name);

  assert(resource, 'Invalid resource.');
  assert(domain, 'Invalid domain.');

  assert(/^[a-zA-Z0-9][a-zA-Z0-9-/]{1,61}[a-zA-Z0-9-]{2,}$/.test(resource), 'Name could contain only letters, numbers, dashes or slashes.');

  // Compose record.
  const record = {
    license,
    ...dataRecord,
    ...clean({ version }),
    ...clean({ tag })
  };

  if (record.version === 'false') {
    record.version = null;
  }

  // Inject IPFS CID.
  set(record, hashPath, CID.from(cid).value);

  verbose && log(`Registering ${resource}.` + (record.tag ? ` Tagged ${record.tag.join(', ')}.` : '') + (record.version ? ` Version ${record.version}.` : ''));

  if (verbose || noop) {
    log(JSON.stringify({ record }, undefined, 2));
  }

  const client: { registryClient: IRegistryClient } = await getDXNSClient();

  const recordType = await client.registryClient.getResourceRecord(DXN.parse(type), 'latest');
  assert(recordType);
  assert(recordType.record.kind === RecordKind.Type, `Can not find type "${type}" in DXNS.`);

  let recordCID;
  if (!noop) {
    recordCID = await client.registryClient.insertDataRecord(record, recordType?.record.cid, {
      description,
      displayName,
      tags
    });
  }

  const domainKey = await client.registryClient.resolveDomainName(domain);
  const opts: UpdateResourceOptions = { version: record.version, tags: record.tag ?? ['latest'] };
  verbose && log(`Assigning name ${resource}...`);
  if (!noop && recordCID) {
    try {
      await client.registryClient.updateResource(DXN.fromDomainKey(domainKey, resource), account, recordCID, opts);
    } catch (err) {
      if (skipExisting && String(err).includes('VersionAlreadyExists')) {
        verbose && log('Skipping existing version.');
      } else {
        throw err;
      }
    }
  }

  verbose && log(`Registered ${resource}.` + (record.tag ? ` Tagged ${record.tag.join(', ')}.` : '') + (record.version ? ` Version ${record.version}.` : ''));
};
