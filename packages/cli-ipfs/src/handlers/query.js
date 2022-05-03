//
// Copyright 2020 DXOS.org
//

import assert from 'assert';

import { print } from '@dxos/cli-core';
import { CID, DXN } from '@dxos/registry-client';

import { FILE_TYPE_DXN } from '../config';

export const displayApps = (record) => {
  return ({
    cid: record.cid.toString(),
    created: record.meta.created,
    fileName: record.data.fileName,
    contentType: record.data.contentType,
    hash: CID.from(Buffer.from(record.data.bundle, 'base64')).toString()
  });
};

export const query = ({ getDXNSClient }) => async (argv) => {
  const { json } = argv;

  let files = [];
  assert(getDXNSClient);
  const client = await getDXNSClient();
  const registry = client.registryClient;
  const fileType = await registry.getResourceRecord(DXN.parse(FILE_TYPE_DXN), 'latest');

  if (!fileType) {
    throw new Error('App type not found.');
  }

  const records = await registry.getDataRecords({ type: fileType.record.cid });

  files = records.map(displayApps);

  if (files && files.length) {
    print(files, { json });
  }
};
