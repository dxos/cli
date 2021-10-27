//
// Copyright 2021 DXOS.org
//

import assert from 'assert';
import fs from 'fs';

import { CID, DXN, IRegistryClient, RecordKind } from '@dxos/registry-client';

import { uploadToIPFS } from '.';
import { FILE_DXN_NAME } from '../handlers/types';

export const registerTypedefFile = async (registry: IRegistryClient, definitions: string): Promise<CID> => {
  if (!fs.existsSync(definitions)) {
    throw new Error('Incorrect path to definitons. File or directory does not exist');
  }
  let recursive = false;
  if (!fs.lstatSync(definitions).isDirectory) {
    recursive = true;
  }
  const hash = uploadToIPFS(definitions, { recursive });
  const fileType = await registry.getResourceRecord(DXN.parse(FILE_DXN_NAME), 'latest');
  assert(fileType);
  assert(fileType.record.kind === RecordKind.Type);
  const sourceIpfsCid = await registry.insertDataRecord({
    hash
  }, fileType.record.cid,
  {
    description: 'Protobuf definitions'
  });
  return sourceIpfsCid;
};
