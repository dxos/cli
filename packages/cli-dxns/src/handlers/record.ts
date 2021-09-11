//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { DXN, DomainKey, RegistryRecord, CID } from '@dxos/registry-api';

import { Params } from './common';

export const displayRecord = (record: RegistryRecord) => {
  return ({
    cid: record.cid.toString(),
    schema: record.schema.toString(),
    messageFqn: record.messageFqn,
    size: record.size,
    data: record.data
  });
};

export const listRecords = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const output = await client.registryApi.getRecords();

  print(output.map(displayRecord), { json });
};

export const getRecord = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { id, json } = argv;

  const client = await getDXNSClient();
  const record = await client.registryApi.get(DXN.parse(id as string));

  record && print(displayRecord(record), { json });
};

export const addRecord = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json, name, domain } = argv;
  if (!!name !== !!domain) {
    throw new Error('Must specify both name and domain or neither.');
  }

  const client = await getDXNSClient();

  const data = JSON.parse(argv.data as string);
  const fqn = argv.fqn as string;
  const resourceName = name as string | undefined;

  const schemaCid = CID.from(argv.schema as string);
  const cid = await client.registryApi.addRecord(data, schemaCid, fqn);
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
