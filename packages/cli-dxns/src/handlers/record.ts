//
// Copyright 2021 DXOS.org
//

import { print } from '@dxos/cli-core';
import { DXN, DomainKey, CID, RecordMetadata } from '@dxos/registry-client';

import { resolveDXNorCID } from '../utils';
import { displayRecord, Params } from './common';

// TODO(marcin): Add query support.
export const listRecords = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const output = await client.registryClient.getRecords();

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

  const { domain, name, version, description, json, typeCid } = argv;

  if (!!name !== !!domain) {
    throw new Error('Must specify both name and domain or neither.');
  }

  const client = await getDXNSClient();

  const data = JSON.parse(argv.data as string);
  const resourceName = name as string | undefined;
  const meta: RecordMetadata = {
    created: new Date(),
    version,
    description
  };
  const schemaCid = CID.from(typeCid as string);

  const cid = await client.registryClient.insertDataRecord(data, schemaCid, meta);
  if (resourceName) {
    const domainKey = DomainKey.fromHex(domain as string);
    await client.registryClient.registerResource(domainKey, resourceName, cid);
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
