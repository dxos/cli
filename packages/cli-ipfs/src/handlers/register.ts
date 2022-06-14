//
// Copyright 2022 DXOS.org
//

import assert from 'assert';
import { Arguments } from 'yargs';

import { CoreOptions } from '@dxos/cli-core';
import { log } from '@dxos/debug';
import { AccountKey, CID, DXN } from '@dxos/registry-client';

import { FILE_TYPE_DXN } from '../config';
import { Params } from '../modules/ipfs';

interface Options extends CoreOptions {
  name?: string
  domain?: string
  cid?: string
  contentType?: string
  fileName?: string
  tag?: string
  skipExisting?: boolean
}

interface QueryParams {
  getDXNSClient: Params['getDXNSClient']
  account: AccountKey
}

export const register = ({ getDXNSClient, account }: QueryParams) => async (argv: Arguments<Options>) => {
  const { name, domain, cid: fileCID, contentType, fileName, tag } = argv;

  assert(name, 'Invalid name.');
  assert(domain, 'Invalid domain.');
  assert(fileCID, 'Invalid file CID.');

  const client = await getDXNSClient();

  const fileType = await client.registryClient.getResource(DXN.parse(FILE_TYPE_DXN));
  assert(fileType?.tags.latest, 'File type not found');

  const cid = await client.registryClient.registerRecord({
    hash: CID.from(fileCID).value,
    contentType,
    fileName
  }, fileType?.tags.latest);

  const domainKey = await client.registryClient.getDomainKey(domain);
  log(`Assigning name ${name}...`);
  await client.registryClient.registerResource(DXN.fromDomainKey(domainKey, name), cid, account, tag ?? 'latest');
};
