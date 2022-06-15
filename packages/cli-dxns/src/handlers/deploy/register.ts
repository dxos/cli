//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import clean from 'lodash-clean';
import set from 'lodash.set';

import { log } from '@dxos/debug';
import { AccountKey, CID, DXN } from '@dxos/registry-client';
import type { RegistryClient } from '@dxos/registry-client';

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

  // TODO(wittjosiah): Remove? Validation done by DXN.
  assert(/^[a-zA-Z0-9][a-zA-Z0-9-/]{1,61}[a-zA-Z0-9-]{2,}$/.test(resource), 'Name could contain only letters, numbers, dashes or slashes.');

  // Compose record.
  const record = {
    license,
    ...dataRecord,
    ...clean({ build: { tag, version } })
  };

  if (record.build?.version === 'false') {
    record.build.version = null;
  }

  // Inject IPFS CID.
  set(record, hashPath, CID.from(cid).value);

  verbose && log(
    `Registering ${resource}.` +
    (record.build?.tag ? ` Tagged ${record.build.tag}.` : '') +
    (record.build?.version ? ` Version ${record.build.version}.` : '')
  );

  if (verbose || noop) {
    log(JSON.stringify({ record }, undefined, 2));
  }

  const client: { registryClient: RegistryClient } = await getDXNSClient();

  const typeResource = await client.registryClient.getResource(DXN.parse(type));
  assert(typeResource, `Can not find type "${type}".`);
  const typeCid = typeResource.tags.latest;
  assert(typeCid, `No latest tag registered for type "${type}".`);

  let recordCID;
  if (!noop) {
    recordCID = await client.registryClient.registerRecord(record, typeCid, {
      description,
      displayName,
      tags
    });
  }

  const domainKey = await client.registryClient.getDomainKey(domain);
  if (!noop && recordCID) {
    verbose && log(`Assigning name ${resource}@${tag}...`);
    await client.registryClient.registerResource(
      DXN.fromDomainKey(domainKey, resource),
      recordCID,
      account,
      tag ?? 'latest'
    );
  }

  if (!noop && version && recordCID) {
    verbose && log(`Assigning name ${resource}@${version}...`);
    await registerVersion(
      client.registryClient,
      DXN.fromDomainKey(domainKey, resource),
      version,
      recordCID,
      account,
      skipExisting
    );
  }

  verbose && log(
    `Registered ${resource}.` +
    (record.build?.tag ? ` Tagged ${record.build.tag}.` : '') +
    (record.build?.version ? ` Version ${record.build.version}.` : '')
  );
};

const registerVersion = (
  registry: RegistryClient,
  name: DXN,
  version: string,
  recordCID: CID,
  account: AccountKey,
  skipExisting: boolean
) => async () => {
  const resource = await registry.getResource(name);

  console.log({ resource, tags: resource?.tags, tag: resource?.tags[version], name, version, recordCID, account, skipExisting });

  if (skipExisting && resource?.tags[version]) {
    return;
  }

  await registry.registerResource(
    name,
    recordCID,
    account,
    version
  );
};
