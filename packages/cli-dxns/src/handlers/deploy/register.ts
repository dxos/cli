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

  const { authority, path } = DXN.parse(name);

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
    `Registering ${path}.` +
    (record.build?.tag ? ` Tagged ${record.build.tag}.` : '') +
    (record.build?.version ? ` Version ${record.build.version}.` : '')
  );

  if (verbose || noop) {
    log(JSON.stringify({ record }, undefined, 2));
  }

  const client: { registryClient: RegistryClient } = await getDXNSClient();

  const typeResource = await client.registryClient.getResource(DXN.parse(type));
  assert(typeResource, `Can not find type "${type}".`);

  let recordCID;
  if (!noop) {
    recordCID = await client.registryClient.registerRecord(record, typeResource, {
      description,
      displayName,
      tags
    });
  }

  const domainKey = typeof authority === 'string' ? await client.registryClient.getDomainKey(authority) : authority;
  if (!noop && recordCID) {
    verbose && log(`Assigning name ${path}@${tag}...`);
    // TODO(wittjosiah): Force tag to be specified when registering?
    await client.registryClient.registerResource(
      DXN.fromDomainKey(domainKey, path, tag ?? 'latest'),
      recordCID,
      account
    );
  }

  if (!noop && version && recordCID) {
    verbose && log(`Assigning name ${path}@${version}...`);
    await registerVersion(
      client.registryClient,
      DXN.fromDomainKey(domainKey, path, version),
      recordCID,
      account,
      skipExisting
    );
  }

  verbose && log(
    `Registered ${path}.` +
    (record.build?.tag ? ` Tagged ${record.build.tag}.` : '') +
    (record.build?.version ? ` Version ${record.build.version}.` : '')
  );
};

const registerVersion = async (
  registry: RegistryClient,
  name: DXN,
  recordCID: CID,
  account: AccountKey,
  skipExisting: boolean
) => {
  const resource = await registry.getResource(name);

  if (skipExisting && resource) {
    return;
  }

  await registry.registerResource(
    name,
    recordCID,
    account
  );
};
