//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { DXN, DomainKey, CID, RecordMetadata } from '@dxos/registry-client';

import { Params } from '../interfaces';
import { resolveDXNorCID } from '../utils';
import { displayRecord } from './common';

// TODO(marcin): Add query support.
export const listRecords = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const output = await client.registryClient.listRecords();

  print(output.map(displayRecord), { json });
};

export const getRecord = (params: Params) => async (argv: any) => {
  const json = !!argv.json;

  const client = await params.getDXNSClient();
  const cid = await resolveDXNorCID(client, argv);

  const record = await client.registryClient.getRecord(cid);

  record && print(displayRecord(record), { json });
};

export const addDataRecord = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { domain, name, description, json, schema } = argv;

  if (!!name !== !!domain) {
    throw new Error('Must specify both name and domain or neither.');
  }

  const client = await getDXNSClient();
  const account = await client.getDXNSAccount(argv);

  const data = JSON.parse(argv.data as string);
  const resourceName = name as string | undefined;
  // TODO(wittjosiah): Add display name and tags.
  const meta: RecordMetadata = {
    description
  };
  const schemaCid = CID.from(schema as string);

  const cid = await client.registryClient.registerRecord(data, schemaCid, meta);
  if (resourceName) {
    const domainKey = DomainKey.fromHex(domain as string);
    const name = DXN.fromDomainKey(domainKey, resourceName);
    await client.registryClient.registerResource(name, cid, account);
    return print({
      id: DXN.fromDomainKey(domainKey, resourceName).toString(),
      cid: cid.toB58String(),
      domainKey: domainKey.toHex()
    }, { json });
  }

  print({
    cid: cid.toB58String()
  }, { json });
};
