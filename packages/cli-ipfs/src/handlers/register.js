//
// Copyright 2021 DXOS.org
//

import assert from 'assert';

import { log } from '@dxos/debug';
import { CID, DXN, RecordKind } from '@dxos/registry-client';

import { FILE_DXN_NAME } from '../config';

export const register = (getDXNSClient) => async (argv) => {
  const { name, domain, cid: fileCID, contentType, fileName, version, tag, skipExisting } = argv;

  assert(name, 'Invalid name.');
  assert(domain, 'Invalid domain.');
  assert(version, 'Invalid version.');

  const client = await getDXNSClient();

  const fileType = await client.registryClient.getResourceRecord(DXN.parse(FILE_DXN_NAME), 'latest');
  assert(fileType);
  assert(fileType.record.kind === RecordKind.Type);

  const cid = await client.registryClient.insertDataRecord({
    hash: CID.from(fileCID).value,
    contentType,
    fileName
  }, fileType?.record.cid);

  const domainKey = await client.registryClient.resolveDomainName(domain);
  const opts = { version, tags: tag ?? ['latest'] };
  log(`Assigning name ${name}...`);
  try {
    await client.registryClient.updateResource(DXN.fromDomainKey(domainKey, name), cid, opts);
  } catch (err) {
    if (skipExisting && String(err).includes('VersionAlreadyExists')) {
      log('Skipping existing version.');
    } else {
      throw err;
    }
  }
};
