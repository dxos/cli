//
// Copyright 2021 DXOS.org
//

import { DXN, CID } from '@dxos/registry-client';

import { DXNSClient } from '../index';

export const resolveDXNorCID = async (client: DXNSClient, argv: any): Promise<CID> => {
  let dxn: DXN | undefined;
  try {
    dxn = DXN.parse(argv.dxn as string);
  } catch (e: any) {}
  let cid: CID | undefined;
  if (dxn) {
    cid = await client.registryClient.resolveRecordCid(dxn);
  } else {
    cid = CID.from(argv.cid as string);
  }

  if (!cid) {
    throw new Error('CID not provided nor resolved through the provided DXN.');
  }

  return cid;
};
