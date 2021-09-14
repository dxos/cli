//
// Copyright 2021 DXOS.org
//

import pb from 'protobufjs';

import { print } from '@dxos/cli-core';
import { CID, DomainKey, DXN, RecordMetadata } from '@dxos/registry-api';

import { Params } from './common';

export const listTypes = (params: Params) => async (argv: any) => {
  const client = await params.getDXNSClient();
  const types = await client.registryApi.getTypes();

  print(types, { json: argv.json });
};

export const getType = (params: Params) => async (argv: any) => {
  const dxn = argv.dxn ? DXN.parse(argv.dxn as string) : undefined;
  let cid = argv.cid ? CID.from(argv.cid as string) : undefined;

  if (!dxn && !cid) {
    throw new Error('Either DXN or CID must be provided');
  }

  const client = await params.getDXNSClient();
  cid = cid ?? await client.registryApi.resolve(dxn!);

  if (!cid) {
    throw new Error('CID not provided nor resolved through the provided DXN.');
  }

  const typeRecord = await client.registryApi.getTypeRecord(cid);
  if (!typeRecord) {
    throw new Error(`No type registered under CID ${cid}.`);
  }

  print(typeRecord, { json: argv.json });
};

export const addType = (params: Params) => async (argv: any) => {
  const { path, domain, name, version, description, author, json } = argv;

  if (!!name !== !!domain) {
    throw new Error('You must specify both name and domain or neither.');
  }

  const client = await params.getDXNSClient();
  const schemaRoot = await pb.load(path as string);
  const meta: RecordMetadata = {
    created: new Date().getTime().toString(),
    version,
    name,
    description,
    author
  };

  // @ts-ignore - remove after publishing and using the new version of registry API
  const cid = await client.registryApi.insertTypeRecord(schemaRoot, name, meta);

  if (name) {
    const domainKey = DomainKey.fromHex(domain as string);
    await client.registryApi.registerResource(domainKey, name as string, cid);

    print({
      id: DXN.fromDomainKey(domainKey, name as string).toString(),
      cid: cid.toB58String(),
      domainKey: domainKey.toHex()
    }, { json });
  } else {
    print({ cid: cid.toB58String() }, { json });
  }
};
