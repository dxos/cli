//
// Copyright 2021 DXOS.org
//

import pb from 'protobufjs';

import { print } from '@dxos/cli-core';
import { DomainKey, DXN } from '@dxos/registry-api';

import { Params } from './common';

export const listSchemas = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();
  const schemas = await client.registryApi.getSchemas();

  print(schemas.map((schema: any) => ({ ...schema, dataRaw: undefined })), { json });
};

export const querySchema = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json } = argv;

  const client = await getDXNSClient();

  const dxn = DXN.parse(argv.dxn as string);
  const cid = await client.registryApi.resolve(dxn);
  if (!cid) {
    throw new Error('Name not resolved.');
  }

  const root = await client.registryApi.getSchema(cid);
  if (!root) {
    throw new Error('Not found');
  }

  print(root.toJSON(), { json });
};

export const getSchema = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { json, cid } = argv;

  const client = await getDXNSClient();
  const root = await client.registryApi.getSchema(cid as string);
  if (!root) {
    throw new Error('Not found');
  }

  print(root.toJSON(), { json });
};

export const addSchema = (params: Params) => async (argv: any) => {
  const { getDXNSClient } = params;

  const { path, name, domain, json } = argv;

  if (!!name !== !!domain) {
    throw new Error('Must specify both name and domain or neither.');
  }

  const client = await getDXNSClient();
  const root = await pb.load(path as string);

  const hash = await client.registryApi.addSchema(root);

  if (name) {
    const domainKey = DomainKey.fromHex(domain as string);
    await client.registryApi.registerResource(domainKey, name as string, hash);

    print({
      id: DXN.fromDomainKey(domainKey, name as string).toString(),
      cid: hash.toB58String(),
      domainKey: domainKey.toHex()
    }, { json });
  } else {
    print({ cid: hash.toB58String() }, { json });
  }
};
