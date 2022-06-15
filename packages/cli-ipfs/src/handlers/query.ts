//
// Copyright 2020 DXOS.org
//

import assert from 'assert';
import { Arguments } from 'yargs';

import { print, CoreOptions } from '@dxos/cli-core';
import type { DXNSClient } from '@dxos/cli-dxns';
import { CID, DXN, RegistryRecord } from '@dxos/registry-client';

import { FILE_TYPE_DXN } from '../config';

interface QueryParams {
  getDXNSClient: () => Promise<DXNSClient>
}

export const displayApps = (record: RegistryRecord) => {
  return ({
    cid: record.cid.toString(),
    created: record.created,
    fileName: record.payload.fileName,
    contentType: record.payload.contentType,
    bundle: CID.from(Buffer.from(record.payload.bundle, 'base64')).toString()
  });
};

export const query = ({ getDXNSClient }: QueryParams) => async (argv: Arguments<CoreOptions>) => {
  const { json } = argv;

  assert(getDXNSClient);
  const client = await getDXNSClient();
  const registry = client.registryClient;
  const fileType = await registry.getResource(DXN.parse(FILE_TYPE_DXN));
  assert(fileType?.tags.latest, 'App type not found.');

  const records = await registry.getRecords({ type: fileType.tags.latest });
  const files = records.map(displayApps);

  if (files && files.length) {
    print(files, { json });
  }
};
