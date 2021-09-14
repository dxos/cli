//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { DXN, DomainKey, RegistryRecord, CID, RecordMetadata } from '@dxos/registry-api';

import { Params } from './common';

export const displayRecord = (record: RegistryRecord) => {
  const common = {
    kind: record.kind,
    cid: record.cid.toString(),
    ...record.meta
  };

  switch (record.kind) {
    case 'type': return { ...common, messageName: record.messageName };
    case 'data': return { ...common, typeCID: record.type, size: record.dataSize, data: record.data };
  }
};

// TODO(marcin): Add query support.
export const listRecords = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const output = await client.registryApi.getRecords();

  print(output.map(displayRecord), { json });
};

export const getRecord = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;
  const { cid, json } = argv;
  const parsedCID = CID.from(cid);

  const client = await getDXNSClient();
  const record = await client.registryApi.getRecord(parsedCID);

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
    created: new Date().getTime().toString(),
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
