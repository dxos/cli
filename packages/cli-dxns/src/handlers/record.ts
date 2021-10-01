//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { DXN, DomainKey, CID, RecordMetadata } from '@dxos/registry-api';

import { displayRecord, Params } from './common';

// TODO(marcin): Add query support.
export const listRecords = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const output = await client.registryApi.getRecords();

  print(output.map(displayRecord), { json });
};

export const getRecord = (params: Params) => async (argv: any) => {
  const json = !!argv.json;
  const dxn = argv.dxn ? DXN.parse(argv.dxn as string) : undefined;
  let cid = argv.cid ? CID.from(argv.cid as string) : undefined;

  if ((!dxn && !cid) || (!!dxn && !!cid)) {
    throw new Error('Either DXN or CID must be provided.');
  }

  const client = await params.getDXNSClient();
  cid = cid ?? await client.registryApi.resolveRecordCid(dxn!);

  if (!cid) {
    throw new Error('CID not provided nor resolved through the provided DXN.');
  }

  const record = await client.registryApi.getRecord(cid);

  record && print(displayRecord(record), { json });
};

export const addDataRecord = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { domain, name, version, description, author, json, typeCid } = argv;

  if (!!name !== !!domain) {
    throw new Error('Must specify both name and domain or neither.');
  }

  const client = await getDXNSClient();

  const data = JSON.parse(argv.data as string);
  const resourceName = name as string | undefined;
  const meta: RecordMetadata = {
    created: new Date(),
    version,
    name,
    description,
    author
  };
  const schemaCid = CID.from(typeCid as string);

  const cid = await client.registryApi.insertDataRecord(data, schemaCid, meta);
  if (resourceName) {
    const domainKey = DomainKey.fromHex(domain as string);
    await client.registryApi.registerResource(domainKey, resourceName, cid);
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
